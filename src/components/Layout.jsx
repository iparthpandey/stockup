import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Menu,
  X,
  Database
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Orders', href: '/orders', icon: ShoppingBag },
  ];

  const getPageTitle = () => {
    const current = navigation.find((item) => {
      if (item.href === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(item.href);
    });
    return current ? current.name : 'Detail View';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#f4f4f5',
            border: '1px solid #27272a',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#18181b',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#18181b',
            },
          },
        }}
      />

      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-indigo-500" />
          <span className="font-semibold text-lg tracking-tight">StockFlow</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1 text-zinc-400 hover:text-zinc-100 focus:outline-none"
          aria-label="Open Sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex md:flex-col shrink-0`}
      >
        {/* Brand Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-indigo-500" />
            <span className="font-semibold text-lg tracking-tight text-white">StockFlow</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-zinc-400 hover:text-zinc-100"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-zinc-800 text-white font-medium shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Account / Context section */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/80 flex items-center justify-center font-medium text-white text-sm">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Doe</p>
              <p className="text-xs text-zinc-500 truncate">john@company.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header for Desktop */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30">
          <h1 className="text-lg font-medium text-zinc-100 tracking-tight">{getPageTitle()}</h1>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              API Connected
            </span>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
