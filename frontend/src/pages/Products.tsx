import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Loader2, Filter, Package, AlertTriangle } from 'lucide-react';
import Modal from '../components/ui/Modal';

interface Category { id: string; name: string; }
interface Supplier { id: string; companyName: string; }
interface Product {
  id: string; name: string; sku: string; barcode?: string;
  category?: Category; supplier?: Supplier;
  sellingPrice: number; purchasePrice: number; currentStock: number;
  minimumStock: number; unit: string; status: string; stockStatus: string;
}

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  supplierId: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, 'Must be ≥ 0'),
  sellingPrice: z.coerce.number().min(0, 'Must be ≥ 0'),
  currentStock: z.coerce.number().int().min(0, 'Must be ≥ 0'),
  minimumStock: z.coerce.number().int().min(0, 'Must be ≥ 0'),
  unit: z.string().min(1, 'Unit is required'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).default('ACTIVE'),
});
type ProductForm = z.infer<typeof productSchema>;

export default function Products() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get('/products', { params: { search } });
      return res.data ?? [];
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-select'],
    queryFn: async () => { const res = await api.get('/categories'); return res.data ?? []; }
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-select'],
    queryFn: async () => { const res = await api.get('/suppliers'); return res.data ?? []; }
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { status: 'ACTIVE', currentStock: 0, minimumStock: 5, unit: 'pcs' }
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) => api.post('/products', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); closeModal(); }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductForm }) => api.put(`/products/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); closeModal(); }
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  });

  const openCreate = () => { setEditing(null); reset({ status: 'ACTIVE', currentStock: 0, minimumStock: 5, unit: 'pcs' }); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    reset({
      name: p.name, sku: p.sku || '', barcode: p.barcode || '',
      categoryId: p.category?.id || '', supplierId: p.supplier?.id || '',
      purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice,
      currentStock: p.currentStock, minimumStock: p.minimumStock,
      unit: p.unit, status: p.status as any,
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); reset(); };
  const onSubmit = (form: ProductForm) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const stockBadge = (status: string) => {
    const map: Record<string, string> = {
      IN_STOCK: 'bg-emerald-100 text-emerald-700',
      LOW_STOCK: 'bg-orange-100 text-orange-700',
      OUT_OF_STOCK: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-gray-500 mt-1">Manage your inventory catalog</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors shadow-lg shadow-indigo-200">
          <Plus className="w-5 h-5" /><span>Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search by name, SKU..." value={search} onChange={e => setSearch(e.target.value)}
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
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products?.map((p: Product) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-indigo-500" />
                        </div>
                        <span className="font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{p.sku || '-'}</td>
                    <td className="px-6 py-4">
                      {p.category && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{p.category.name}</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{Number(p.sellingPrice).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        {p.currentStock <= p.minimumStock && p.currentStock > 0 && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                        <span className={p.currentStock === 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          {p.currentStock} {p.unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${stockBadge(p.stockStatus)}`}>
                        {p.stockStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (window.confirm('Delete this product?')) deleteMutation.mutate(p.id); }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {(!products || products.length === 0) && <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No products found. Add one to get started.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Product' : 'Add Product'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input {...register('name')} placeholder="Product name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input {...register('sku')} placeholder="e.g. PROD-001"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input {...register('barcode')} placeholder="Barcode number"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register('categoryId')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                <option value="">Select category...</option>
                {categories?.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select {...register('supplierId')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                <option value="">Select supplier...</option>
                {suppliers?.map((s: Supplier) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹) *</label>
              <input {...register('purchasePrice')} type="number" step="0.01" min="0" placeholder="0.00"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              {errors.purchasePrice && <p className="text-red-500 text-xs mt-1">{errors.purchasePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
              <input {...register('sellingPrice')} type="number" step="0.01" min="0" placeholder="0.00"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
              <input {...register('currentStock')} type="number" min="0" placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              {errors.currentStock && <p className="text-red-500 text-xs mt-1">{errors.currentStock.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock *</label>
              <input {...register('minimumStock')} type="number" min="0" placeholder="5"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <input {...register('unit')} placeholder="pcs, kg, ltr..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('description')} rows={2} placeholder="Optional product description..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2">
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editing ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
