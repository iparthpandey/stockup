// Fallback mockup dataset
export const initialProducts = [
  {
    id: 1,
    name: 'MacBook Pro 16" (M3 Max)',
    sku: 'APP-MBP16-M3M',
    price: 3499.00,
    quantity_in_stock: 14,
    quantity: 14
  },
  {
    id: 2,
    name: 'Sony WH-1000XM5 Headphones',
    sku: 'SNY-WH1000XM5',
    price: 398.00,
    quantity_in_stock: 7, // Low Stock
    quantity: 7
  },
  {
    id: 3,
    name: 'Dell UltraSharp 32" 4K Monitor',
    sku: 'DEL-U3223QE',
    price: 849.99,
    quantity_in_stock: 22,
    quantity: 22
  },
  {
    id: 4,
    name: 'Keychron Q1 Max Keyboard',
    sku: 'KEY-Q1M-US',
    price: 219.00,
    quantity_in_stock: 3, // Low Stock
    quantity: 3
  },
  {
    id: 5,
    name: 'Logitech MX Master 3S Mouse',
    sku: 'LOG-MX3S-GRY',
    price: 99.99,
    quantity_in_stock: 45,
    quantity: 45
  },
  {
    id: 6,
    name: 'iPad Pro 13" (M4)',
    sku: 'APP-IPP13-M4',
    price: 1299.00,
    quantity_in_stock: 0, // Out of Stock
    quantity: 0
  }
];

export const initialCustomers = [
  {
    id: 1,
    name: 'Alice Vance',
    full_name: 'Alice Vance',
    email: 'alice.vance@stripe.com',
    phone: '+1 (555) 013-4482',
    phone_number: '+1 (555) 013-4482'
  },
  {
    id: 2,
    name: 'Bob Miller',
    full_name: 'Bob Miller',
    email: 'bob@vercel.com',
    phone: '+1 (555) 019-9921',
    phone_number: '+1 (555) 019-9921'
  },
  {
    id: 3,
    name: 'Charlie Day',
    full_name: 'Charlie Day',
    email: 'charlie.day@linear.app',
    phone: '+1 (555) 012-7734',
    phone_number: '+1 (555) 012-7734'
  },
  {
    id: 4,
    name: 'Diana Prince',
    full_name: 'Diana Prince',
    email: 'diana@amazon.com',
    phone: '+1 (555) 017-3841',
    phone_number: '+1 (555) 017-3841'
  }
];

export const initialOrders = [
  {
    id: 1,
    customer_id: 1,
    product_id: 2,
    quantity: 2,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: 2,
    customer_id: 2,
    product_id: 1,
    quantity: 1,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
  },
  {
    id: 3,
    customer_id: 3,
    product_id: 5,
    quantity: 3,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 4,
    customer_id: 1,
    product_id: 3,
    quantity: 1,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 5,
    customer_id: 4,
    product_id: 4,
    quantity: 1,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  }
];
