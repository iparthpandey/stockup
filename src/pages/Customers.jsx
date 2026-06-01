import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  Loader2,
  Users2
} from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(1, 'Full Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().min(1, 'Phone Number is required'),
});

export default function Customers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const { data: customers = [], isLoading, isError } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (newCustomer) => customersApi.create(newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully');
      setIsAddOpen(false);
      resetAdd();
    },
    onError: (error) => {
      console.error(error);
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Failed to add customer';
      // Reflect the error back onto the email field if it is a duplicate
      if (detail && detail.toLowerCase().includes('already exists')) {
        const lower = detail.toLowerCase();
        if (lower.includes('phone')) {
          setErrorAdd('phone', { type: 'server', message });
        } else {
          setErrorAdd('email', { type: 'server', message });
        }
      } else {
        toast.error(message);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
      setDeletingCustomer(null);
    },
    onError: (error) => {
      console.error(error);
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to delete customer. Make sure they do not have active orders.');
    },
  });

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    formState: { errors: errorsAdd },
    reset: resetAdd,
    setError: setErrorAdd,
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

  const onAddSubmit = (data) => {
    const normalizePhone = (p) => (p || '').toString().replace(/\D/g, '');

    const emailExists = customers.some(
      (c) => (c.email || '').toLowerCase() === data.email.toLowerCase()
    );
    if (emailExists) {
      setErrorAdd('email', { type: 'manual', message: 'A customer with this email already exists' });
      return;
    }

    const phoneExists = customers.some((c) => normalizePhone(c.phone || c.phone_number) === normalizePhone(data.phone));
    if (phoneExists) {
      setErrorAdd('phone', { type: 'manual', message: 'A customer with this mobile number already exists' });
      return;
    }
    createMutation.mutate({
      name: data.name,
      full_name: data.name,
      email: data.email,
      phone: data.phone,
      phone_number: data.phone,
    });
  };

  const filteredCustomers = customers.filter((c) => {
    const name = (c.name || c.full_name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const phone = (c.phone || c.phone_number || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    return name.includes(term) || email.includes(term) || phone.includes(term);
  });

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Customers Directory</h2>
          <p className="text-xs text-zinc-400">Total of {filteredCustomers.length} registered accounts</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm focus:outline-none transition-colors duration-150 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
        <Search className="h-5 w-5 text-zinc-500 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or phone number..."
          className="flex-1 bg-transparent border-none text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-zinc-400">Fetching customer base...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
            <p className="text-sm text-zinc-300">Failed to load customers.</p>
            <p className="text-xs text-zinc-500">Could not retrieve client profiles from backend server.</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Users2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">No customers found</p>
              <p className="text-xs text-zinc-500 mt-1">
                {searchTerm ? 'Try adjusting your search query.' : 'Get started by registering your first customer.'}
              </p>
            </div>
            {!searchTerm && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors"
              >
                Add customer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-zinc-900/30">
                <tr>
                  <th className="py-3.5 px-4 md:px-6">Customer Profile</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/65">
                {filteredCustomers.map((customer) => {
                  const customerName = customer.name || customer.full_name || 'No Name';
                  const customerPhone = customer.phone || customer.phone_number || 'N/A';

                  return (
                    <tr key={customer.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 px-4 md:px-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 text-indigo-400 font-semibold flex items-center justify-center text-xs shrink-0 select-none">
                          {getInitials(customerName)}
                        </div>
                        <div className="font-medium text-white truncate max-w-[180px]">
                          {customerName}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-zinc-300 truncate max-w-[200px]">{customer.email}</td>
                      <td className="py-4 px-4 font-mono text-xs text-zinc-400">{customerPhone}</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setDeletingCustomer(customer)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-flex"
                          title="Delete customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Customer">
        <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              {...registerAdd('name')}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Jane Doe"
            />
            {errorsAdd.name && <p className="text-xs text-red-500 mt-1">{errorsAdd.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              {...registerAdd('email')}
              className={`w-full px-3.5 py-2 text-sm bg-zinc-950 border rounded-lg text-white focus:outline-none ${
                errorsAdd.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-zinc-800 focus:border-indigo-500'
              }`}
              placeholder="jane.doe@example.com"
            />
            {errorsAdd.email && <p className="text-xs text-red-500 mt-1">{errorsAdd.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Phone Number *
            </label>
            <input
              type="tel"
              {...registerAdd('phone')}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="+1 (555) 019-2834"
            />
            {errorsAdd.phone && <p className="text-xs text-red-500 mt-1">{errorsAdd.phone.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {createMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingCustomer} onClose={() => setDeletingCustomer(null)} title="Delete Customer confirmation">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you sure you want to delete the profile for <span className="font-semibold text-white">"{deletingCustomer?.name || deletingCustomer?.full_name}"</span>?
            This will permanently remove their records.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setDeletingCustomer(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(deletingCustomer.id)}
              disabled={deleteMutation.isLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {deleteMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
