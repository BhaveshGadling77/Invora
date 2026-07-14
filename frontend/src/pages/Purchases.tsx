import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2, ArrowDownToLine, Eye, Building, Trash2, PackagePlus } from 'lucide-react';
import Modal from '../components/ui/Modal';

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: { companyName: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}
interface Supplier { id: string; companyName: string; }
interface Product { id: string; name: string; sku: string; unit: string; purchasePrice: number; }

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.coerce.number().int().min(1, 'Min 1'),
    unitPrice: z.coerce.number().min(0, 'Must be ≥ 0'),
  })).min(1, 'Add at least one item'),
});
type PurchaseForm = z.infer<typeof purchaseSchema>;

export default function Purchases() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', search],
    queryFn: async () => {
      const res = await api.get('/purchases', { params: { search } });
      return res.data ?? [];
    }
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-select'],
    queryFn: async () => { const res = await api.get('/suppliers'); return res.data ?? []; }
  });

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => { const res = await api.get('/products'); return res.data ?? []; }
  });

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { items: [{ productId: '', quantity: 1, unitPrice: 0 }] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');

  const grandTotal = watchedItems?.reduce((sum: number, item: any) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0) || 0;

  // Auto-fill unit price when product is selected
  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p: Product) => p.id === productId);
    if (product) setValue(`items.${index}.unitPrice`, product.purchasePrice);
  };

  const createMutation = useMutation({
    mutationFn: (data: PurchaseForm) => api.post('/purchases', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); closeModal(); },
  });

  const closeModal = () => { setModalOpen(false); reset({ items: [{ productId: '', quantity: 1, unitPrice: 0 }] }); };
  const onSubmit = (form: PurchaseForm) => createMutation.mutate(form);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Purchases</h1>
          <p className="text-gray-500 mt-1">Manage purchase orders and inward stock</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors shadow-lg shadow-indigo-200">
            <Plus className="w-5 h-5" /><span>New Purchase</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search by purchase number or supplier..." value={search} onChange={e => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Purchase No.</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.map((purchase: Purchase) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={purchase.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-indigo-600">{purchase.purchaseNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{purchase.supplier.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(purchase.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        purchase.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                        purchase.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                      }`}>{purchase.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">₹{Number(purchase.totalAmount).toFixed(2)}</td>
                  </motion.tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No purchases yet. Create one to start tracking stock.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Purchase Modal */}
      <Modal open={modalOpen} onClose={closeModal} title="New Purchase Order" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Error from mutation */}
          {createMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {(createMutation.error as any)?.response?.data?.message || 'Failed to create purchase. Please try again.'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select {...register('supplierId')} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select supplier...</option>
                {suppliers?.map((s: Supplier) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
              {errors.supplierId && <p className="text-red-500 text-xs mt-1">{errors.supplierId.message}</p>}
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Items *</label>
              <button type="button" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center space-x-1">
                <Plus className="w-4 h-4" /><span>Add Item</span>
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-left font-medium w-24">Qty</th>
                    <th className="px-3 py-2 text-left font-medium w-32">Unit Price (₹)</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Total</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, index) => {
                    const qty = Number(watchedItems?.[index]?.quantity) || 0;
                    const price = Number(watchedItems?.[index]?.unitPrice) || 0;
                    return (
                      <tr key={field.id}>
                        <td className="px-3 py-2">
                          <select {...register(`items.${index}.productId`)}
                            onChange={e => { register(`items.${index}.productId`).onChange(e); handleProductChange(index, e.target.value); }}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                            <option value="">Select product...</option>
                            {products?.map((p: Product) => <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>)}
                          </select>
                          {errors.items?.[index]?.productId && <p className="text-red-500 text-xs mt-0.5">{errors.items[index]?.productId?.message}</p>}
                        </td>
                        <td className="px-3 py-2">
                          <input {...register(`items.${index}.quantity`)} type="number" min="1"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                        </td>
                        <td className="px-3 py-2">
                          <input {...register(`items.${index}.unitPrice`)} type="number" step="0.01" min="0"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          ₹{(qty * price).toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          {fields.length > 1 && (
                            <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-red-500 text-xs mt-1">{errors.items.message as string}</p>
            )}
          </div>

          {/* Grand Total */}
          <div className="bg-indigo-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-gray-700">Grand Total</span>
            <span className="text-xl font-bold text-indigo-700">₹{grandTotal.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Optional notes..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting || createMutation.isPending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2">
              {(isSubmitting || createMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
              <span>Record Purchase</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
