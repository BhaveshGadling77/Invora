import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2, Eye, UserCircle, Trash2, Receipt } from 'lucide-react';
import Modal from '../components/ui/Modal';

interface Sale {
  id: string;
  invoiceNumber: string;
  customer?: { name: string };
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}
interface Customer { id: string; name: string; }
interface Product { id: string; name: string; sku: string; unit: string; sellingPrice: number; currentStock: number; }

const saleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER']),
  amountPaid: z.coerce.number().min(0, 'Must be ≥ 0'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.coerce.number().int().min(1, 'Min 1'),
    unitPrice: z.coerce.number().min(0, 'Must be ≥ 0'),
    discount: z.coerce.number().min(0).max(100).optional(),
  })).min(1, 'Add at least one item'),
});
type SaleForm = z.infer<typeof saleSchema>;

export default function Sales() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sales', search],
    queryFn: async () => {
      const res = await api.get('/sales', { params: { search } });
      return res.data ?? [];
    }
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => { const res = await api.get('/customers'); return res.data ?? []; }
  });

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => { const res = await api.get('/products'); return res.data ?? []; }
  });

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<SaleForm>({
    resolver: zodResolver(saleSchema),
    defaultValues: { paymentMethod: 'CASH', amountPaid: 0, items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const watchedAmountPaid = watch('amountPaid');

  // Calculate totals
  const subtotal = watchedItems?.reduce((sum: number, item: any) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0) || 0;

  const totalDiscount = watchedItems?.reduce((sum: number, item: any) => {
    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + lineTotal * ((Number(item.discount) || 0) / 100);
  }, 0) || 0;

  const grandTotal = subtotal - totalDiscount;
  const balance = grandTotal - (Number(watchedAmountPaid) || 0);

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p: Product) => p.id === productId);
    if (product) setValue(`items.${index}.unitPrice`, product.sellingPrice);
  };

  const createMutation = useMutation({
    mutationFn: (data: SaleForm) => api.post('/sales', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); closeModal(); },
  });

  const closeModal = () => {
    setModalOpen(false);
    reset({ paymentMethod: 'CASH', amountPaid: 0, items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }] });
  };
  const onSubmit = (form: SaleForm) => createMutation.mutate(form);

  const paymentStatusColor = (status: string) => {
    if (status === 'PAID') return 'bg-emerald-100 text-emerald-700';
    if (status === 'PARTIAL') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales</h1>
          <p className="text-gray-500 mt-1">Manage sales invoices and transactions</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors shadow-lg shadow-indigo-200">
          <Plus className="w-5 h-5" /><span>New Invoice</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search by invoice number or customer..." value={search} onChange={e => setSearch(e.target.value)}
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
                  <th className="px-6 py-4">Invoice No.</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.map((sale: Sale) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-indigo-600">{sale.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      {sale.customer ? (
                        <div className="flex items-center space-x-2"><UserCircle className="w-4 h-4 text-gray-400" /><span className="text-gray-900">{sale.customer.name}</span></div>
                      ) : <span className="text-gray-400 italic">Walk-in</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(sale.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{sale.paymentMethod}</span></td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${paymentStatusColor(sale.paymentStatus)}`}>{sale.paymentStatus}</span></td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">₹{Number(sale.totalAmount).toFixed(2)}</td>
                  </motion.tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No sales yet. Create an invoice to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      <Modal open={modalOpen} onClose={closeModal} title="New Sales Invoice" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {createMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {(createMutation.error as any)?.response?.data?.message || 'Failed to create invoice. Please check stock levels.'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer (optional)</label>
              <select {...register('customerId')} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Walk-in Customer</option>
                {customers?.map((c: Customer) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
              <select {...register('paymentMethod')} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="CASH">💵 Cash</option>
                <option value="CARD">💳 Card</option>
                <option value="UPI">📱 UPI</option>
                <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Items *</label>
              <button type="button" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0 })}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center space-x-1">
                <Plus className="w-4 h-4" /><span>Add Item</span>
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-left font-medium w-20">Qty</th>
                    <th className="px-3 py-2 text-left font-medium w-28">Price (₹)</th>
                    <th className="px-3 py-2 text-left font-medium w-20">Disc %</th>
                    <th className="px-3 py-2 text-right font-medium w-24">Total</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, index) => {
                    const qty = Number(watchedItems?.[index]?.quantity) || 0;
                    const price = Number(watchedItems?.[index]?.unitPrice) || 0;
                    const disc = Number(watchedItems?.[index]?.discount) || 0;
                    const lineTotal = qty * price * (1 - disc / 100);
                    return (
                      <tr key={field.id}>
                        <td className="px-3 py-2">
                          <select {...register(`items.${index}.productId`)}
                            onChange={e => { register(`items.${index}.productId`).onChange(e); handleProductChange(index, e.target.value); }}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                            <option value="">Select product...</option>
                            {products?.map((p: Product) => (
                              <option key={p.id} value={p.id} disabled={p.currentStock === 0}>
                                {p.name} {p.sku ? `(${p.sku})` : ''} {p.currentStock === 0 ? '— Out of Stock' : `— Stock: ${p.currentStock}`}
                              </option>
                            ))}
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
                        <td className="px-3 py-2">
                          <input {...register(`items.${index}.discount`)} type="number" min="0" max="100" defaultValue={0}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          ₹{lineTotal.toFixed(2)}
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
          </div>

          {/* Totals Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span><span>-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
              <span>Total</span><span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹) *</label>
              <input {...register('amountPaid')} type="number" step="0.01" min="0"
                placeholder="0.00" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
              {errors.amountPaid && <p className="text-red-500 text-xs mt-1">{errors.amountPaid.message}</p>}
            </div>
            <div className="flex items-end pb-2.5">
              <div className={`w-full text-center py-2 rounded-xl font-semibold text-sm ${
                balance <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
              }`}>
                {balance <= 0 ? '✅ Fully Paid' : `⚠️ Balance: ₹${balance.toFixed(2)}`}
              </div>
            </div>
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
              {(isSubmitting || createMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              <span>Create Invoice</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
