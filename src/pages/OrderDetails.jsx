import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, productsApi, customersApi } from '../api/api';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Hash,
  Mail,
  Phone,
  User,
  Package,
  AlertTriangle,
  Loader2,
  Receipt
} from 'lucide-react';

export default function OrderDetails() {
  const { id } = useParams();

  const { data: order, isLoading: loadingOrder, isError: errorOrder } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
  });

  const productId = order?.product_id;
  const customerId = order?.customer_id;

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.getById(customerId),
    enabled: !!customerId,
  });

  const isLoading = loadingOrder || (!!productId && loadingProduct) || (!!customerId && loadingCustomer);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-zinc-400">Retrieving invoice details...</p>
      </div>
    );
  }

  if (errorOrder || !order) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-xl flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <div className="text-center">
          <h4 className="font-semibold text-white">Order not found</h4>
          <p className="text-sm text-zinc-400 mt-1">
            The transaction ID #{id} does not match any record.
          </p>
        </div>
        <Link
          to="/orders"
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const customerName = customer?.name || customer?.full_name || order.customer?.name || order.customer?.full_name || `Customer #${order.customer_id}`;
  const customerEmail = customer?.email || order.customer?.email || 'N/A';
  const customerPhone = customer?.phone || customer?.phone_number || order.customer?.phone || order.customer?.phone_number || 'N/A';

  const productName = product?.name || order.product?.name || `Product #${order.product_id}`;
  const productSku = product?.sku || order.product?.sku || 'N/A';
  const productPrice = product?.price || order.product?.price || order.product_price || 0;

  const subtotal = productPrice * order.quantity;
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const datePlaced = order.created_at
    ? new Date(order.created_at).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders List
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Transaction Record</span>
            <span className="inline-block px-2 py-0.5 font-mono text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              Processed
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-1.5">
            <Hash className="h-5 w-5 text-indigo-500 shrink-0" />
            Order #{order.id}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 px-3.5 py-2 border border-zinc-800 rounded-lg shrink-0">
          <Calendar className="h-4 w-4 text-indigo-400" />
          <span>{datePlaced}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <User className="h-4 w-4 text-indigo-400" />
              Customer Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-zinc-500">Client Name</p>
                <p className="text-zinc-200 font-medium mt-1 truncate">{customerName}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Email Address</p>
                <p className="text-zinc-200 font-medium mt-1 flex items-center gap-1 truncate" title={customerEmail}>
                  <Mail className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  {customerEmail}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Phone Number</p>
                <p className="text-zinc-200 font-medium mt-1 flex items-center gap-1 truncate">
                  <Phone className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  {customerPhone}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <Package className="h-4 w-4 text-indigo-400" />
              Purchased Product Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
              <div className="sm:col-span-2">
                <p className="text-xs text-zinc-500">Item Description</p>
                <p className="text-zinc-200 font-medium mt-1 truncate">{productName}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">SKU Reference</p>
                <p className="text-zinc-200 font-mono text-xs mt-1 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/70 inline-block truncate">
                  {productSku}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Unit Price</p>
                <p className="text-zinc-200 font-medium mt-1">${productPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <Receipt className="h-4 w-4 text-indigo-400" />
              Invoice Summary
            </h4>
            
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Unit Price</span>
                <span className="font-mono">${productPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quantity Ordered</span>
                <span className="font-mono">x {order.quantity}</span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2.5">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-200">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax Estimate (8%)</span>
                <span className="font-mono text-zinc-200">${tax.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-zinc-300">Total Price</span>
              <span className="text-xl font-mono font-bold text-white">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg flex items-center gap-2.5 text-xs text-zinc-400">
              <CreditCard className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Fulfilled. Stock updated.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
