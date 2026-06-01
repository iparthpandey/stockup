import { useQuery } from '@tanstack/react-query';
import { productsApi, customersApi, ordersApi } from '../api/api';
import {
  Package,
  Users,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function Dashboard() {
  const { data: products = [], isLoading: loadingProducts, isError: errorProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const { data: customers = [], isLoading: loadingCustomers, isError: errorCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  });

  const { data: orders = [], isLoading: loadingOrders, isError: errorOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll(),
  });

  const isLoading = loadingProducts || loadingCustomers || loadingOrders;
  const isError = errorProducts || errorCustomers || errorOrders;

  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalOrders = orders.length;

  const lowStockThreshold = 10;
  const lowStockProducts = products.filter((p) => p.quantity_in_stock <= lowStockThreshold || p.quantity <= lowStockThreshold);
  const lowStockCount = lowStockProducts.length;

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

  const getChartData = () => {
    if (!orders.length) {
      return [
        { date: 'Mon', count: 0, revenue: 0 },
        { date: 'Tue', count: 0, revenue: 0 },
        { date: 'Wed', count: 0, revenue: 0 },
        { date: 'Thu', count: 0, revenue: 0 },
        { date: 'Fri', count: 0, revenue: 0 },
        { date: 'Sat', count: 0, revenue: 0 },
        { date: 'Sun', count: 0, revenue: 0 },
      ];
    }

    const groups = {};
    orders.forEach((order) => {
      const dateStr = order.created_at
        ? new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'Unknown';
      
      const total = resolveOrderTotal(order);

      if (!groups[dateStr]) {
        groups[dateStr] = { count: 0, revenue: 0 };
      }
      groups[dateStr].count += 1;
      groups[dateStr].revenue += total;
    });

    return Object.entries(groups)
      .map(([date, val]) => ({
        date,
        count: val.count,
        revenue: Math.round(val.revenue),
      }))
      .slice(-7);
  };

  const chartData = getChartData();

  const getStockChartData = () => {
    if (!products.length) return [];
    
    const sorted = [...products]
      .sort((a, b) => (b.quantity_in_stock || b.quantity || 0) - (a.quantity_in_stock || a.quantity || 0))
      .slice(0, 5);

    return sorted.map(p => ({
      name: p.name.length > 12 ? `${p.name.substring(0, 10)}...` : p.name,
      stock: p.quantity_in_stock !== undefined ? p.quantity_in_stock : p.quantity || 0
    }));
  };

  const stockChartData = getStockChartData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-zinc-400">Loading your business dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-xl flex items-center gap-4">
        <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
        <div>
          <h4 className="font-semibold">Failed to load dashboard data</h4>
          <p className="text-sm text-red-300/80 mt-1">
            Please check that your backend server is running and accessible at {import.meta.env.VITE_API_URL || 'http://localhost:8000'}.
          </p>
        </div>
      </div>
    );
  }

  const totalInventoryValue = products.reduce((acc, p) => {
    const qty = p.quantity_in_stock !== undefined ? p.quantity_in_stock : p.quantity || 0;
    return acc + (p.price * qty);
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-card flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Products</p>
            <h3 className="text-3xl font-semibold tracking-tight text-white">{totalProducts}</h3>
            <p className="text-xs text-zinc-500">
              Valued at <span className="text-zinc-300 font-medium">${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <Package className="h-5 w-5 text-indigo-400" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-card flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Customers</p>
            <h3 className="text-3xl font-semibold tracking-tight text-white">{totalCustomers}</h3>
            <p className="text-xs text-zinc-500">Registered accounts</p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-card flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-3xl font-semibold tracking-tight text-white">{totalOrders}</h3>
            <p className="text-xs text-zinc-500">Orders completed</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className={`bg-zinc-900 border rounded-xl p-6 transition-card flex items-start justify-between ${
          lowStockCount > 0 ? 'border-amber-500/30' : 'border-zinc-800'
        }`}>
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Low Stock Items</p>
            <h3 className={`text-3xl font-semibold tracking-tight ${lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
              {lowStockCount}
            </h3>
            <p className="text-xs text-zinc-500">Threshold: &le; 10 units</p>
          </div>
          <div className={`p-3 rounded-lg ${
            lowStockCount > 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800 border border-zinc-700'
          }`}>
            <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                Revenue Activity
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">Estimated order totals over time</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              Live updates
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-zinc-100">Top Product Stock</h4>
            <p className="text-xs text-zinc-500 mt-0.5">Highest inventory volume items</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            {stockChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#27272a', opacity: 0.2 }}
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Bar dataKey="stock" name="Stock Qty" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {stockChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-zinc-500">No stock data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-zinc-100">Recent Orders</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Last 5 customer placements</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              All orders
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {orders.length > 0 ? (
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-zinc-900/30">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/65">
                  {orders.slice(-5).reverse().map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs text-zinc-300">
                        <Link to={`/orders/${order.id}`} className="hover:underline text-indigo-400">
                          #{order.id}
                        </Link>
                      </td>
                      <td className="py-3 px-3 truncate max-w-[120px] text-zinc-200">
                        {resolveCustomerName(order)}
                      </td>
                      <td className="py-3 px-3 truncate max-w-[140px]">
                        {resolveProductName(order)}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-300">{order.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono text-white font-medium">
                        ${resolveOrderTotal(order).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-zinc-500">No orders found.</p>
                <Link to="/orders" className="text-xs text-indigo-400 mt-1 hover:underline">
                  Create your first order
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-zinc-100">Low Stock Warnings</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Items needing replenishment</p>
            </div>
            <Link
              to="/products"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              Manage stock
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {lowStockProducts.length > 0 ? (
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-zinc-900/30">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3 text-right">In Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/65">
                  {lowStockProducts.slice(0, 5).map((product) => {
                    const qty = product.quantity_in_stock !== undefined ? product.quantity_in_stock : product.quantity;
                    return (
                      <tr key={product.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-3 px-3 text-zinc-200 font-medium truncate max-w-[150px]">
                          {product.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-zinc-400">{product.sku}</td>
                        <td className="py-3 px-3 font-mono text-zinc-300">${product.price.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`inline-block px-2 py-0.5 font-mono text-xs rounded-full font-semibold ${
                            qty === 0
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {qty} left
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-zinc-500">All product stock levels are healthy.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
