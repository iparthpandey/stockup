import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, productsApi, customersApi } from '../api/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

const orderSchema = z.object({
  customer_id: z.coerce.number().int().gt(0, 'Please select a customer'),
  product_id: z.coerce.number().int().gt(0, 'Please select a product'),
  quantity: z.coerce.number().int().gt(0, 'Quantity must be at least 1'),
});

export default function Orders() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [serverError, setServerError] = useState('');

  const { data: orders = [], isLoading: loadingOrders, isError: errorOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll(),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
    staleTime: 0,
  });

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  });

  const isLoading = loadingOrders || loadingProducts || loadingCustomers;
  const isError = errorOrders;

  const createMutation = useMutation({
    mutationFn: (newOrder) => ordersApi.create(newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Order placed successfully');
      setIsAddOpen(false);
      resetAdd();
      setServerError('');
    },
    onError: (error) => {
      console.error(error);
      const detail = error.response?.data?.detail;
      let errorMessage = 'Failed to create order. Please try again.';
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((err) => err.msg || err.message).join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setServerError(errorMessage);
      toast.error('Order creation rejected by server');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Order deleted successfully');
      setDeletingOrder(null);
    },
    onError: (error) => {
      console.error(error);
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to delete order');
    },
  });

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    formState: { errors: errorsAdd },
    reset: resetAdd,
    watch,
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: { customer_id: '', product_id: '', quantity: '' },
  });

  const watchedProductId = watch('product_id');
  const watchedQuantity  = watch('quantity');
  const selectedProduct  = products.find((p) => p.id === parseInt(watchedProductId));

  const selectedStock = selectedProduct
    ? (selectedProduct.quantity_in_stock !== undefined
        ? selectedProduct.quantity_in_stock
        : selectedProduct.quantity ?? 0)
    : null;

  const isOutOfStock      = selectedStock !== null && selectedStock === 0;
  const isLowStock        = selectedStock !== null && selectedStock > 0 && selectedStock <= 10;
  const parsedQty         = parseInt(watchedQuantity);
  const exceedsStock      = selectedStock !== null && !isNaN(parsedQty) && parsedQty > selectedStock;
  const blockSubmit       = isOutOfStock || exceedsStock;

  const getPreviewTotal = () => {
    if (!selectedProduct || !watchedQuantity || isNaN(parsedQty)) return 0;
    return selectedProduct.price * parsedQty;
  };

  const onAddSubmit = (data) => {
    setServerError('');
    createMutation.mutate({
      customer_id: parseInt(data.customer_id),
      product_id: parseInt(data.product_id),
      quantity: parseInt(data.quantity),
    });
  };

  const resolveCustomerName = (order) => {
    if (order.customer?.name) return order.customer.name;
    if (order.customer_name) return order.customer_name;
    const found = customers.find((c) => c.id === order.customer_id);
    return found ? found.name || found.full_name : `Customer #${order.customer_id}`;
  };

  const resolveProductName = (order) => {
    if (order.product?.name) return order.product.name;
    if (order.product_name) return order.product_name;
    const found = products.find((p) => p.id === order.product_id);
    return found ? found.name : `Product #${order.product_id}`;
  };

  const resolveProductPrice = (order) => {
    if (order.product?.price) return order.product.price;
    if (order.product_price) return order.product_price;
    const found = products.find((p) => p.id === order.product_id);
    return found ? found.price : 0;
  };

  const resolveOrderTotal = (order) => {
    const price = resolveProductPrice(order);
    return price * order.quantity;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Orders Ledger</h2>
          <p className="text-xs text-zinc-400">Total of {orders.length} transaction entries</p>
        </div>
        <button
          onClick={() => {
            setServerError('');
            setIsAddOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm focus:outline-none transition-colors duration-150 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Order
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-zinc-400">Fetching transaction logs...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
            <p className="text-sm text-zinc-300">Failed to load orders.</p>
            <p className="text-xs text-zinc-500">Could not retrieve order logs from backend server.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">No orders found</p>
              <p className="text-xs text-zinc-500 mt-1">
                Establish client orders to track sales and auto-decrement product stock.
              </p>
            </div>
            <button
              onClick={() => {
                setServerError('');
                setIsAddOpen(true);
              }}
              className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors"
            >
              New Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-zinc-900/30">
                <tr>
                  <th className="py-3.5 px-4 md:px-6">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Qty</th>
                  <th className="py-3.5 px-4">Total Price</th>
                  <th className="py-3.5 px-4">Date Placed</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/65">
                {[...orders].reverse().map((order) => {
                  const customerName = resolveCustomerName(order);
                  const productName = resolveProductName(order);
                  const total = resolveOrderTotal(order);
                  const dateStr = order.created_at
                    ? new Date(order.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 px-4 md:px-6 font-mono text-xs text-indigo-400 font-semibold">
                        #{order.id}
                      </td>
                      <td className="py-4 px-4 font-medium text-white truncate max-w-[150px]">{customerName}</td>
                      <td className="py-4 px-4 truncate max-w-[180px]">{productName}</td>
                      <td className="py-4 px-4 font-mono text-zinc-300">{order.quantity}</td>
                      <td className="py-4 px-4 font-mono text-zinc-200 font-medium">
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-zinc-400 text-xs">{dateStr}</td>
                      <td className="py-4 px-4 text-right space-x-1 whitespace-nowrap">
                        <Link
                          to={`/orders/${order.id}`}
                          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors inline-flex"
                          title="View order details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeletingOrder(order)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-flex"
                          title="Delete order"
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

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Order">
        <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-start gap-2.5 text-red-200 text-xs">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Backend Validation Error</p>
                <p className="text-red-300/80 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Select Customer *
            </label>
            <select
              {...registerAdd('customer_id')}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.full_name} ({c.email})
                </option>
              ))}
            </select>
            {errorsAdd.customer_id && (
              <p className="text-xs text-red-500 mt-1">{errorsAdd.customer_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Select Product *
            </label>
            <select
              {...registerAdd('product_id')}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => {
                const qty = p.quantity_in_stock !== undefined ? p.quantity_in_stock : p.quantity || 0;
                return (
                  <option key={p.id} value={p.id} disabled={qty === 0}>
                    {p.name} — ${p.price.toFixed(2)} ({qty > 0 ? `${qty} in stock` : 'OUT OF STOCK'})
                  </option>
                );
              })}
            </select>
            {errorsAdd.product_id && (
              <p className="text-xs text-red-500 mt-1">{errorsAdd.product_id.message}</p>
            )}

            {/* Out-of-stock / low-stock feedback */}
            {isOutOfStock && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                This product is currently out of stock and cannot be ordered.
              </div>
            )}
            {isLowStock && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                Only <span className="font-semibold mx-0.5">{selectedStock}</span> units left in stock.
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              {...registerAdd('quantity')}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. 5"
            />
            {errorsAdd.quantity && <p className="text-xs text-red-500 mt-1">{errorsAdd.quantity.message}</p>}
            {exceedsStock && !isOutOfStock && (
              <p className="text-xs text-red-400 mt-1">
                Only {selectedStock} unit{selectedStock !== 1 ? 's' : ''} available — reduce your quantity.
              </p>
            )}
          </div>

          {selectedProduct && parsedQty > 0 && !blockSubmit && (
            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg flex items-center justify-between text-xs">
              <span className="text-zinc-500">Invoice Estimate:</span>
              <span className="font-mono font-semibold text-white text-sm">
                ${getPreviewTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

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
              disabled={createMutation.isLoading || blockSubmit}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {createMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Place Order
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingOrder} onClose={() => setDeletingOrder(null)} title="Cancel/Delete Order confirmation">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you sure you want to cancel and delete order <span className="font-semibold text-white">#{deletingOrder?.id}</span>?
            This will remove the transaction record and restore the product quantity back to stock.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setDeletingOrder(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(deletingOrder.id)}
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
