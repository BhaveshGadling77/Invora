import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Loader2, UserCircle, Mail, Phone } from 'lucide-react';
import Modal from '../components/ui/Modal';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  gstNumber?: string;
  address?: string;
  createdAt: string;
}

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required'),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;

export default function Customers() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { search } });
      return res.data ?? [];
    }
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomerForm) => api.post('/customers', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); closeModal(); }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerForm }) => api.put(`/customers/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); closeModal(); }
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  });

  const openCreate = () => { setEditing(null); reset(); setModalOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); reset({ name: c.name, email: c.email || '', phone: c.phone, gstNumber: c.gstNumber || '', address: c.address || '' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); reset(); };
  const onSubmit = (form: CustomerForm) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer database</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors shadow-lg shadow-indigo-200">
          <Plus className="w-5 h-5" /><span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
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
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">GST Number</th>
                  <th className="px-6 py-4">Added On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.map((c: Customer) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-600">
                          <UserCircle className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {c.email && <div className="flex items-center text-gray-500 text-xs"><Mail className="w-3 h-3 mr-1" />{c.email}</div>}
                        <div className="flex items-center text-gray-500 text-xs"><Phone className="w-3 h-3 mr-1" />{c.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{c.gstNumber ? <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{c.gstNumber}</span> : <span className="text-gray-400">-</span>}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (window.confirm('Delete this customer?')) deleteMutation.mutate(c.id); }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {(!data || data.length === 0) && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No customers found. Add one to get started.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input {...register('name')} placeholder="John Doe"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input {...register('email')} type="email" placeholder="customer@email.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input {...register('phone')} placeholder="+91 9876543210"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
            <input {...register('gstNumber')} placeholder="22AAAAA0000A1Z5"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea {...register('address')} rows={2} placeholder="Street address..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2">
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editing ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
