import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  PackageCheck
} from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Product Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().gt(0, 'Price must be greater than 0'),
  quantity_in_stock: z.coerce.number().int().min(0, 'Quantity must be 0 or greater'),
});

export default function Products() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (newProduct) => productsApi.create(newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      setIsAddOpen(false);
      resetAdd();
    },
    onError: (error) => {
      console.error(error);
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      setEditingProduct(null);
    },
    onError: (error) => {
      console.error(error);
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
      setDeletingProduct(null);
    },
    onError: (error) => {
      console.error(error);
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to delete product. Make sure it is not used in existing orders.');
    },
  });

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    formState: { errors: errorsAdd },
    reset: resetAdd,
    setError: setErrorAdd,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', sku: '', price: '', quantity_in_stock: '' },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    setValue: setValueEdit,
    setError: setErrorEdit,
  } = useForm({
    resolver: zodResolver(productSchema),
  });

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setValueEdit('name', product.name);
    setValueEdit('sku', product.sku);
    setValueEdit('price', product.price);
    setValueEdit('quantity_in_stock', product.quantity_in_stock !== undefined ? product.quantity_in_stock : product.quantity);
  };

  const onAddSubmit = (data) => {
    const skuExists = products.some((p) => p.sku.toLowerCase() === data.sku.toLowerCase());
    if (skuExists) {
      setErrorAdd('sku', { type: 'manual', message: 'This SKU is already in use' });
      return;
    }
    createMutation.mutate({
      name: data.name,
      sku: data.sku,
      price: data.price,
      quantity_in_stock: data.quantity_in_stock,
      quantity: data.quantity_in_stock,
    });
  };

  const onEditSubmit = (data) => {
    const skuExists = products.some((p) => p.id !== editingProduct.id && p.sku.toLowerCase() === data.sku.toLowerCase());
    if (skuExists) {
      setErrorEdit('sku', { type: 'manual', message: 'This SKU is already in use' });
      return;
    }
    updateMutation.mutate({
      id: editingProduct.id,
      data: {
        name: data.name,
        sku: data.sku,
        price: data.price,
        quantity_in_stock: data.quantity_in_stock,
        quantity: data.quantity_in_stock,
      },
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Products Inventory</h2>
          <p className="text-xs text-zinc-400">Total of {filteredProducts.length} items listed</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm focus:outline-none transition-colors duration-150 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
        <Search className="h-5 w-5 text-zinc-500 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="flex-1 bg-transparent border-none text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-zinc-400">Fetching inventory items...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
            <p className="text-sm text-zinc-300">Failed to load products.</p>
            <p className="text-xs text-zinc-500">Could not retrieve stock data from backend server.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">No products found</p>
              <p className="text-xs text-zinc-500 mt-1">
                {searchTerm ? 'Try adjusting your search filters.' : 'Get started by creating your first product.'}
              </p>
            </div>
            {!searchTerm && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors"
              >
                Add product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-zinc-900/30">
                <tr>
                  <th className="py-3.5 px-4 md:px-6">Product Details</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4 text-center">Stock Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/65">
                {filteredProducts.map((product) => {
                  const qty = product.quantity_in_stock !== undefined ? product.quantity_in_stock : product.quantity;
                  const isLowStock = qty <= 10;
                  const isOutOfStock = qty === 0;

                  return (
                    <tr key={product.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 px-4 md:px-6 font-medium text-white max-w-[200px] truncate">
                        {product.name}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-zinc-400">{product.sku}</td>
                      <td className="py-4 px-4 font-mono text-zinc-200">${product.price.toFixed(2)}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-semibold border ${
                          isOutOfStock
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : isLowStock
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOutOfStock ? 'bg-red-400' : isLowStock ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} />
                          {isOutOfStock ? 'Out of stock' : isLowStock ? `${qty} low stock` : `${qty} available`}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors inline-flex"
                          title="Edit product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-flex"
                          title="Delete product"
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

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Product">
        <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              {...registerAdd('name')}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Wireless Noise Canceling Headphones"
            />
            {errorsAdd.name && <p className="text-xs text-red-500 mt-1">{errorsAdd.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              SKU *
            </label>
            <input
              type="text"
              {...registerAdd('sku')}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none font-mono"
              placeholder="e.g. WH-1000XM4"
            />
            {errorsAdd.sku && <p className="text-xs text-red-500 mt-1">{errorsAdd.sku.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                {...registerAdd('price')}
                className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                placeholder="299.99"
              />
              {errorsAdd.price && <p className="text-xs text-red-500 mt-1">{errorsAdd.price.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                Quantity In Stock *
              </label>
              <input
                type="number"
                {...registerAdd('quantity_in_stock')}
                className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                placeholder="50"
              />
              {errorsAdd.quantity_in_stock && (
                <p className="text-xs text-red-500 mt-1">{errorsAdd.quantity_in_stock.message}</p>
              )}
            </div>
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
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title="Modify Product details">
        <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              {...registerEdit('name')}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            />
            {errorsEdit.name && <p className="text-xs text-red-500 mt-1">{errorsEdit.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              SKU *
            </label>
            <input
              type="text"
              {...registerEdit('sku')}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none font-mono"
            />
            {errorsEdit.sku && <p className="text-xs text-red-500 mt-1">{errorsEdit.sku.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                {...registerEdit('price')}
                className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              />
              {errorsEdit.price && <p className="text-xs text-red-500 mt-1">{errorsEdit.price.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                Quantity In Stock *
              </label>
              <input
                type="number"
                {...registerEdit('quantity_in_stock')}
                className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              />
              {errorsEdit.quantity_in_stock && (
                <p className="text-xs text-red-500 mt-1">{errorsEdit.quantity_in_stock.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {updateMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingProduct} onClose={() => setDeletingProduct(null)} title="Delete Product confirmation">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you sure you want to delete <span className="font-semibold text-white">"{deletingProduct?.name}"</span>?
            This action cannot be undone and will remove the product permanently.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setDeletingProduct(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(deletingProduct.id)}
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
