// src/hooks/usePharmacy.ts
import useSWR from 'swr';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

import {
  productCategoryService,
  pharmacyProductService,
  cartService,
  pharmacyOrderService
} from '@/services/pharmacy.service';
import {
  PaginatedResponse,
  ProductCategory, ProductCategoryPayload,
  PharmacyProduct, PharmacyProductPayload, PharmacyProductStats,
  Cart, AddToCartPayload, UpdateCartItemPayload, RemoveFromCartPayload,
  PharmacyOrder, PharmacyOrderPayload, UpdatePharmacyOrderPayload, PharmacyOrderStats,
} from '@/types/pharmacy.types';

export const usePharmacy = () => {
  const { mutate: swrMutate } = useSWRConfig();

  // ==================== PRODUCT CATEGORIES ====================
  const useProductCategories = (queryParams?: Record<string, any>) => {
    return useSWR<PaginatedResponse<ProductCategory>>(
      ['productCategories', queryParams],
      () => productCategoryService.list(queryParams)
    );
  };

  const useProductCategory = (id: number | null) => {
    return useSWR<ProductCategory>(
      id ? ['productCategory', id] : null,
      () => productCategoryService.retrieve(id!)
    );
  };

  const createProductCategory = useMutation({
    mutationFn: (payload: ProductCategoryPayload) => productCategoryService.create(payload),
    onSuccess: () => {
      swrMutate((key) => Array.isArray(key) && key[0] === 'productCategories');
      toast.success('Product category created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create product category');
    },
  });

  const updateProductCategory = useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: ProductCategoryPayload }) => productCategoryService.update(id, payload),
    onSuccess: (_, { id }) => {
      swrMutate(['productCategory', id]);
      swrMutate((key) => Array.isArray(key) && key[0] === 'productCategories');
      toast.success('Product category updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update product category');
    },
  });
  
  const partialUpdateProductCategory = useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: Partial<ProductCategoryPayload> }) => productCategoryService.partialUpdate(id, payload),
    onSuccess: (_, { id }) => {
      swrMutate(['productCategory', id]);
      swrMutate((key) => Array.isArray(key) && key[0] === 'productCategories');
      toast.success('Product category updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update product category');
    },
  });

  const deleteProductCategory = useMutation({
    mutationFn: (id: number) => productCategoryService.destroy(id),
    onSuccess: () => {
      swrMutate((key) => Array.isArray(key) && key[0] === 'productCategories');
      toast.success('Product category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete product category');
    },
  });

  // ==================== PHARMACY PRODUCTS ====================
  const usePharmacyProducts = (queryParams?: Record<string, any>) => {
    return useSWR<PaginatedResponse<PharmacyProduct>>(
      ['pharmacyProducts', queryParams],
      () => pharmacyProductService.list(queryParams)
    );
  };

  const usePharmacyProduct = (id: number | null) => {
    return useSWR<PharmacyProduct>(
      id ? ['pharmacyProduct', id] : null,
      () => pharmacyProductService.retrieve(id!)
    );
  };

  const createPharmacyProduct = useMutation({
    mutationFn: (payload: PharmacyProductPayload) => pharmacyProductService.create(payload),
    onSuccess: () => {
      swrMutate((key) => Array.isArray(key) && key[0] === 'pharmacyProducts');
      swrMutate('pharmacyProductStats');
      toast.success('Pharmacy product created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create pharmacy product');
    },
  });

  const updatePharmacyProduct = useMutation({
    mutationFn: (variables: { id: number } & PharmacyProductPayload) => {
        const { id, ...payload } = variables;
        return pharmacyProductService.update(id, payload);
    },
    onSuccess: (_, variables) => {
      swrMutate(['pharmacyProduct', variables.id]);
      swrMutate((key) => Array.isArray(key) && key[0] === 'pharmacyProducts');
      swrMutate('pharmacyProductStats');
      toast.success('Pharmacy product updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update pharmacy product');
    },
  });

  const partialUpdatePharmacyProduct = useMutation({
    mutationFn: (variables: { id: number } & Partial<PharmacyProductPayload>) => {
        const { id, ...payload } = variables;
        return pharmacyProductService.partialUpdate(id, payload);
    },
    onSuccess: (_, variables) => {
      swrMutate(['pharmacyProduct', variables.id]);
      swrMutate((key) => Array.isArray(key) && key[0] === 'pharmacyProducts');
      swrMutate('pharmacyProductStats');
      toast.success('Pharmacy product updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update pharmacy product');
    },
  });

  const deletePharmacyProduct = useMutation({
    mutationFn: (id: number) => pharmacyProductService.destroy(id),
    onSuccess: () => {
      swrMutate((key) => Array.isArray(key) && key[0] === 'pharmacyProducts');
      swrMutate('pharmacyProductStats');
      toast.success('Pharmacy product deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete pharmacy product');
    },
  });

  const usePharmacyProductStats = () => {
    return useSWR<PharmacyProductStats>(
      'pharmacyProductStats',
      pharmacyProductService.getStatistics
    );
  };

  const useLowStockProducts = (queryParams?: Record<string, any>) => {
    return useSWR<PaginatedResponse<PharmacyProduct>>(
      ['lowStockProducts', queryParams],
      () => pharmacyProductService.getLowStockProducts(queryParams)
    );
  };

  const useNearExpiryProducts = (queryParams?: Record<string, any>) => {
    return useSWR<PaginatedResponse<PharmacyProduct>>(
      ['nearExpiryProducts', queryParams],
      () => pharmacyProductService.getNearExpiryProducts(queryParams)
    );
  };

  const useExpiredProducts = (queryParams?: Record<string, any>) => {
    return useSWR<PaginatedResponse<PharmacyProduct>>(
      ['expiredProducts', queryParams],
      () => pharmacyProductService.getExpiredProducts(queryParams)
    );
  };


  // ==================== CART ====================
  const useCart = (id?: number) => {
    return useSWR<Cart>(
      ['userCart', id],
      () => cartService.getCart(id)
    );
  };

  const addItemToCart = useMutation({
    mutationFn: (payload: AddToCartPayload) => cartService.addItem(payload),
    onSuccess: () => {
      swrMutate('userCart');
      toast.success('Item added to cart successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add item to cart');
    },
  });

  const updateCartItem = useMutation({
    mutationFn: (payload: UpdateCartItemPayload) => cartService.updateItem(payload),
    onSuccess: () => {
      swrMutate('userCart');
      toast.success('Cart item updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update cart item');
    },
  });

  const removeItemFromCart = useMutation({
    mutationFn: (payload: RemoveFromCartPayload) => cartService.removeItem(payload),
    onSuccess: () => {
      swrMutate('userCart');
      toast.success('Item removed from cart successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove item from cart');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      swrMutate('userCart');
      toast.success('Cart cleared successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to clear cart');
    },
  });

  // ==================== PHARMACY ORDERS ====================
  const usePharmacyOrders = (queryParams?: Record<string, any>) => {
    return useSWR<PaginatedResponse<PharmacyOrder>>(
      ['pharmacyOrders', queryParams],
      () => pharmacyOrderService.list(queryParams)
    );
  };

  const usePharmacyOrder = (id: number | null) => {
    return useSWR<PharmacyOrder>(
      id ? ['pharmacyOrder', id] : null,
      () => pharmacyOrderService.retrieve(id!)
    );
  };

  const createPharmacyOrder = useMutation({
    mutationFn: (payload: PharmacyOrderPayload) => pharmacyOrderService.create(payload),
    onSuccess: () => {
      swrMutate((key) => Array.isArray(key) && key[0] === 'pharmacyOrders');
      swrMutate('userCart'); // Cart is cleared after order creation
      toast.success('Pharmacy order created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create pharmacy order');
    },
  });

  const updatePharmacyOrder = useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: UpdatePharmacyOrderPayload }) => pharmacyOrderService.update(id, payload),
    onSuccess: (_, { id }) => {
      swrMutate(['pharmacyOrder', id]);
      swrMutate((key) => Array.isArray(key) && key[0] === 'pharmacyOrders');
      toast.success('Pharmacy order updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update pharmacy order');
    },
  });

  const partialUpdatePharmacyOrder = useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: Partial<UpdatePharmacyOrderPayload> }) => pharmacyOrderService.partialUpdate(id, payload),
    onSuccess: (_, { id }) => {
      swrMutate(['pharmacyOrder', id]);
      swrMutate((key) => Array.isArray(key) && key[0] === 'pharmacyOrders');
      toast.success('Pharmacy order updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update pharmacy order');
    },
  });
  
  const deletePharmacyOrder = useMutation({
    mutationFn: (id: number) => pharmacyOrderService.destroy(id),
    onSuccess: () => {
      swrMutate((key) => Array.isArray(key) && key[0] === 'pharmacyOrders');
      toast.success('Pharmacy order deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete pharmacy order');
    },
  });
  
  const cancelPharmacyOrder = useMutation({
    mutationFn: (id: number) => pharmacyOrderService.cancel(id),
    onSuccess: (_, id) => {
      swrMutate(['pharmacyOrder', id]);
      swrMutate((key) => Array.isArray(key) && key[0] === 'pharmacyOrders');
      toast.success('Pharmacy order cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to cancel pharmacy order');
    },
  });

  const usePharmacyOrderStats = () => {
    return useSWR<PharmacyOrderStats>(
      'pharmacyOrderStats',
      pharmacyOrderService.getStatistics
    );
  };


  return {
    // Categories
    useProductCategories,
    useProductCategory,
    createProductCategory,
    updateProductCategory,
    partialUpdateProductCategory,
    deleteProductCategory,

    // Products
    usePharmacyProducts,
    usePharmacyProduct,
    createPharmacyProduct,
    updatePharmacyProduct,
    partialUpdatePharmacyProduct,
    deletePharmacyProduct,
    usePharmacyProductStats,
    useLowStockProducts,
    useNearExpiryProducts,
    useExpiredProducts,

    // Cart
    useCart,
    addItemToCart,
    updateCartItem,
    removeItemFromCart,
    clearCart: clearCartMutation,

    // Orders
    usePharmacyOrders,
    usePharmacyOrder,
    createPharmacyOrder,
    updatePharmacyOrder,
    partialUpdatePharmacyOrder,
    deletePharmacyOrder,
cancelPharmacyOrder,
    usePharmacyOrderStats,
  };
};

// ==================== INDIVIDUAL EXPORTS ====================
// Export individual cart hooks for direct import

export const useCart = (id?: number) => {
  return useSWR<Cart>(
    ['userCart', id],
    () => cartService.getCart(id)
  );
};

export const addItemToCart = (mutate?: any) => {
  const { mutate: swrMutate } = useSWRConfig();
  const mutateFn = mutate || swrMutate;

  return useMutation({
    mutationFn: (payload: AddToCartPayload) => cartService.addItem(payload),
    onSuccess: () => {
      mutateFn(['userCart']);
      toast.success('Item added to cart successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add item to cart');
    },
  });
};

export const updateCartItem = (mutate?: any) => {
  const { mutate: swrMutate } = useSWRConfig();
  const mutateFn = mutate || swrMutate;

  return useMutation({
    mutationFn: (payload: UpdateCartItemPayload) => cartService.updateItem(payload),
    onSuccess: () => {
      mutateFn(['userCart']);
      toast.success('Cart item updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update cart item');
    },
  });
};

export const removeItemFromCart = (mutate?: any) => {
  const { mutate: swrMutate } = useSWRConfig();
  const mutateFn = mutate || swrMutate;

  return useMutation({
    mutationFn: (payload: RemoveFromCartPayload) => cartService.removeItem(payload),
    onSuccess: () => {
      mutateFn(['userCart']);
      toast.success('Item removed from cart successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove item from cart');
    },
  });
};

export const clearCart = (mutate?: any) => {
  const { mutate: swrMutate } = useSWRConfig();
  const mutateFn = mutate || swrMutate;

  return useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      mutateFn(['userCart']);
      toast.success('Cart cleared successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to clear cart');
    },
  });
};