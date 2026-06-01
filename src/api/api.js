import axios from 'axios';
import toast from 'react-hot-toast';
import { initialProducts, initialCustomers, initialOrders } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Simple helper to notify user when offline/fallback to local DB is used.
// No-op helper when offline; kept to avoid runtime ReferenceError.
const notifyOffline = () => {};

const getLocalDb = () => {
  const products = localStorage.getItem('mock_products');
  const customers = localStorage.getItem('mock_customers');
  const orders = localStorage.getItem('mock_orders');

  if (!products || !customers || !orders) {
    localStorage.setItem('mock_products', JSON.stringify(initialProducts));
    localStorage.setItem('mock_customers', JSON.stringify(initialCustomers));
    localStorage.setItem('mock_orders', JSON.stringify(initialOrders));
    return {
      products: [...initialProducts],
      customers: [...initialCustomers],
      orders: [...initialOrders],
    };
  }

  return {
    products: JSON.parse(products),
    customers: JSON.parse(customers),
    orders: JSON.parse(orders),
  };
};

const saveLocalDb = (db) => {
  localStorage.setItem('mock_products', JSON.stringify(db.products));
  localStorage.setItem('mock_customers', JSON.stringify(db.customers));
  localStorage.setItem('mock_orders', JSON.stringify(db.orders));
};

const isNetworkError = (error) => {
  return !error.response || error.code === 'ERR_NETWORK' || error.message.includes('Network Error');
};

export const productsApi = {
  getAll: async (search = '') => {
    try {
      const response = await apiClient.get('/products', {
        params: search ? { search } : {},
      });
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();
        if (!search) return db.products;
        return db.products.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())
        );
      }
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();
        const found = db.products.find((p) => p.id === parseInt(id));
        if (found) return found;
        throw { response: { status: 404, data: { detail: 'Product not found' } } };
      }
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/products', data);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        notifyOffline();
        const db = getLocalDb();

        const skuExists = db.products.some((p) => p.sku.toLowerCase() === data.sku.toLowerCase());
        if (skuExists) {
          throw { response: { status: 400, data: { detail: `Product with SKU "${data.sku}" already exists.` } } };
        }

        const newProduct = {
          id: db.products.length ? Math.max(...db.products.map((p) => p.id)) + 1 : 1,
          name: data.name,
          sku: data.sku,
          price: parseFloat(data.price),
          quantity_in_stock: parseInt(data.quantity_in_stock),
          quantity: parseInt(data.quantity_in_stock),
        };
        db.products.push(newProduct);
        saveLocalDb(db);
        return newProduct;
      }
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/products/${id}`, data);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();

        const skuExists = db.products.some((p) => p.id !== parseInt(id) && p.sku.toLowerCase() === data.sku.toLowerCase());
        if (skuExists) {
          throw { response: { status: 400, data: { detail: `Product with SKU "${data.sku}" already exists.` } } };
        }

        const index = db.products.findIndex((p) => p.id === parseInt(id));
        if (index === -1) {
          throw { response: { status: 404, data: { detail: 'Product not found' } } };
        }
        const updated = {
          ...db.products[index],
          name: data.name,
          sku: data.sku,
          price: parseFloat(data.price),
          quantity_in_stock: parseInt(data.quantity_in_stock),
          quantity: parseInt(data.quantity_in_stock),
        };
        db.products[index] = updated;
        saveLocalDb(db);
        return updated;
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();
        const parsedId = parseInt(id);
        
        const isInUse = db.orders.some((o) => o.product_id === parsedId);
        if (isInUse) {
          throw { response: { status: 400, data: { detail: 'Cannot delete product. It is linked to existing orders.' } } };
        }

        db.products = db.products.filter((p) => p.id !== parsedId);
        saveLocalDb(db);
        return { message: 'Product deleted' };
      }
      throw error;
    }
  },
};

export const customersApi = {
  getAll: async (search = '') => {
    try {
      const response = await apiClient.get('/customers', {
        params: search ? { search } : {},
      });
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();
        if (!search) return db.customers;
        const term = search.toLowerCase();
        return db.customers.filter(
          (c) =>
            (c.name || c.full_name || '').toLowerCase().includes(term) ||
            (c.email || '').toLowerCase().includes(term)
        );
      }
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();
        const found = db.customers.find((c) => c.id === parseInt(id));
        if (found) return found;
        throw { response: { status: 404, data: { detail: 'Customer not found' } } };
      }
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/customers', data);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();

        const emailExists = db.customers.some((c) => (c.email || '').toLowerCase() === (data.email || '').toLowerCase());
        if (emailExists) {
          throw { response: { status: 400, data: { detail: `Customer with email "${data.email}" already exists.` } } };
        }

        // Normalize phone numbers (digits only) and prevent duplicates
        const normalizePhone = (p) => (p || '').toString().replace(/\D/g, '');
        const phoneExists = db.customers.some((c) => normalizePhone(c.phone || c.phone_number) === normalizePhone(data.phone));
        if (phoneExists) {
          throw { response: { status: 400, data: { detail: `Customer with phone "${data.phone}" already exists.` } } };
        }

        const newCustomer = {
          id: db.customers.length ? Math.max(...db.customers.map((c) => c.id)) + 1 : 1,
          name: data.name,
          full_name: data.name,
          email: data.email,
          phone: data.phone,
          phone_number: data.phone,
        };
        db.customers.push(newCustomer);
        saveLocalDb(db);
        return newCustomer;
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();
        const parsedId = parseInt(id);

        const hasOrders = db.orders.some((o) => o.customer_id === parsedId);
        if (hasOrders) {
          throw { response: { status: 400, data: { detail: 'Cannot delete customer. They have active orders.' } } };
        }

        db.customers = db.customers.filter((c) => c.id !== parsedId);
        saveLocalDb(db);
        return { message: 'Customer deleted' };
      }
      throw error;
    }
  },
};

export const ordersApi = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/orders');
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();
        return db.orders;
      }
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();
        const found = db.orders.find((o) => o.id === parseInt(id));
        if (found) return found;
        throw { response: { status: 404, data: { detail: 'Order not found' } } };
      }
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/orders', data);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        const db = getLocalDb();
        const parsedProductId = parseInt(data.product_id);
        const parsedCustomerId = parseInt(data.customer_id);
        const qtyToOrder = parseInt(data.quantity);

        const customerExists = db.customers.some((c) => c.id === parsedCustomerId);
        if (!customerExists) {
          throw { response: { status: 400, data: { detail: 'Customer does not exist' } } };
        }

        const productIndex = db.products.findIndex((p) => p.id === parsedProductId);
        if (productIndex === -1) {
          throw { response: { status: 400, data: { detail: 'Product does not exist' } } };
        }

        const product = db.products[productIndex];
        const currentStock = product.quantity_in_stock !== undefined ? product.quantity_in_stock : product.quantity || 0;

        if (currentStock < qtyToOrder) {
          throw {
            response: {
              status: 400,
              data: {
                detail: `Insufficient stock. Only ${currentStock} units of "${product.name}" are available.`,
              },
            },
          };
        }

        const updatedStock = currentStock - qtyToOrder;
        db.products[productIndex] = {
          ...product,
          quantity_in_stock: updatedStock,
          quantity: updatedStock,
        };

        const newOrder = {
          id: db.orders.length ? Math.max(...db.orders.map((o) => o.id)) + 1 : 1,
          customer_id: parsedCustomerId,
          product_id: parsedProductId,
          quantity: qtyToOrder,
          created_at: new Date().toISOString(),
        };

        db.orders.push(newOrder);
        saveLocalDb(db);
        return newOrder;
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/orders/${id}`);
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        notifyOffline();
        const db = getLocalDb();
        const parsedId = parseInt(id);

        const orderIndex = db.orders.findIndex((o) => o.id === parsedId);
        if (orderIndex === -1) {
          throw { response: { status: 404, data: { detail: 'Order not found' } } };
        }

        const order = db.orders[orderIndex];

        const productIndex = db.products.findIndex((p) => p.id === order.product_id);
        if (productIndex !== -1) {
          const product = db.products[productIndex];
          const currentStock = product.quantity_in_stock !== undefined ? product.quantity_in_stock : product.quantity || 0;
          const restoredStock = currentStock + order.quantity;

          db.products[productIndex] = {
            ...product,
            quantity_in_stock: restoredStock,
            quantity: restoredStock,
          };
        }

        db.orders = db.orders.filter((o) => o.id !== parsedId);
        saveLocalDb(db);
        return { message: 'Order deleted and stock restored' };
      }
      throw error;
    }
  },
};
