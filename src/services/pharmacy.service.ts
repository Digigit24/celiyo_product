import { hmsClient as apiClient } from '@/lib/client';
import { API_CONFIG } from '@/lib/apiConfig';
import {
  PaginatedResponse,
  ProductCategory,
  ProductCategoryPayload,
  PharmacyProduct,
  PharmacyProductPayload,
  PharmacyProductStats,
  Cart,
  AddToCartPayload,
  UpdateCartItemPayload,
  RemoveFromCartPayload,
  PharmacyOrder,
  PharmacyOrderPayload,
  UpdatePharmacyOrderPayload,
  PharmacyOrderStats,
} from '@/types/pharmacy.types';

const buildPath = (path: string, params: Record<string, string | number>): string => {
  let finalPath = path;
  for (const [key, value] of Object.entries(params)) {
    finalPath = finalPath.replace(`:${key}`, String(value));
  }
  return finalPath;
}

// ==================== PRODUCT CATEGORIES ====================
const productCategoryService = {
  list: async (queryParams?: Record<string, any>): Promise<PaginatedResponse<ProductCategory>> => {
    const response = await apiClient.get(API_CONFIG.HMS.PHARMACY.CATEGORIES_LIST, { params: queryParams });
    return response.data;
  },
  retrieve: async (id: number): Promise<ProductCategory> => {
    const response = await apiClient.get(buildPath(API_CONFIG.HMS.PHARMACY.CATEGORY_DETAIL, { id }));
    return response.data;
  },
  create: async (payload: ProductCategoryPayload): Promise<ProductCategory> => {
    const response = await apiClient.post(API_CONFIG.HMS.PHARMACY.CATEGORY_CREATE, payload);
    return response.data;
  },
  update: async (id: number, payload: ProductCategoryPayload): Promise<ProductCategory> => {
    const response = await apiClient.put(buildPath(API_CONFIG.HMS.PHARMACY.CATEGORY_UPDATE, { id }), payload);
    return response.data;
  },
  partialUpdate: async (id: number, payload: Partial<ProductCategoryPayload>): Promise<ProductCategory> => {
    const response = await apiClient.patch(buildPath(API_CONFIG.HMS.PHARMACY.CATEGORY_PARTIAL_UPDATE, { id }), payload);
    return response.data;
  },
  destroy: async (id: number): Promise<void> => {
    const response = await apiClient.delete(buildPath(API_CONFIG.HMS.PHARMACY.CATEGORY_DELETE, { id }));
    return response.data;
  },
};

// ==================== PHARMACY PRODUCTS ====================
const pharmacyProductService = {
  list: async (queryParams?: Record<string, any>): Promise<PaginatedResponse<PharmacyProduct>> => {
    const response = await apiClient.get(API_CONFIG.HMS.PHARMACY.PRODUCTS_LIST, { params: queryParams });
    return response.data;
  },
  retrieve: async (id: number): Promise<PharmacyProduct> => {
    const response = await apiClient.get(buildPath(API_CONFIG.HMS.PHARMACY.PRODUCT_DETAIL, { id }));
    return response.data;
  },
  create: async (payload: PharmacyProductPayload): Promise<PharmacyProduct> => {
    const response = await apiClient.post(API_CONFIG.HMS.PHARMACY.PRODUCT_CREATE, payload);
    return response.data;
  },
  update: async (id: number, payload: PharmacyProductPayload): Promise<PharmacyProduct> => {
    const response = await apiClient.put(buildPath(API_CONFIG.HMS.PHARMACY.PRODUCT_UPDATE, { id }), payload);
    return response.data;
  },
  partialUpdate: async (id: number, payload: Partial<PharmacyProductPayload>): Promise<PharmacyProduct> => {
    const response = await apiClient.patch(buildPath(API_CONFIG.HMS.PHARMACY.PRODUCT_PARTIAL_UPDATE, { id }), payload);
    return response.data;
  },
  destroy: async (id: number): Promise<void> => {
    const response = await apiClient.delete(buildPath(API_CONFIG.HMS.PHARMACY.PRODUCT_DELETE, { id }));
    return response.data;
  },
  getStatistics: async (): Promise<PharmacyProductStats> => {
    const response = await apiClient.get<{ success: boolean; data: PharmacyProductStats }>(API_CONFIG.HMS.PHARMACY.PRODUCTS_STATISTICS);
    return response.data.data;
  },
  getLowStockProducts: async (queryParams?: Record<string, any>): Promise<PaginatedResponse<PharmacyProduct>> => {
    const response = await apiClient.get(API_CONFIG.HMS.PHARMACY.PRODUCTS_LOW_STOCK, { params: queryParams });
    return response.data;
  },
  getNearExpiryProducts: async (queryParams?: Record<string, any>): Promise<PaginatedResponse<PharmacyProduct>> => {
    const response = await apiClient.get(API_CONFIG.HMS.PHARMACY.PRODUCTS_NEAR_EXPIRY, { params: queryParams });
    return response.data;
  },
  getExpiredProducts: async (queryParams?: Record<string, any>): Promise<PaginatedResponse<PharmacyProduct>> => {
    const response = await apiClient.get(API_CONFIG.HMS.PHARMACY.PRODUCTS_EXPIRED, { params: queryParams });
    return response.data;
  },
};

// ==================== CART ====================
const cartService = {
  getCart: async (id?: number): Promise<Cart> => {
    const url = id ? buildPath(API_CONFIG.HMS.PHARMACY.CART_DETAIL, { id }) : API_CONFIG.HMS.PHARMACY.CART_LIST;
    const response = await apiClient.get(url);
    return response.data;
  },
  addItem: async (payload: AddToCartPayload): Promise<Cart> => {
    const response = await apiClient.post<{ success: boolean; data: Cart }>(API_CONFIG.HMS.PHARMACY.CART_ADD_ITEM, payload);
    return response.data.data;
  },
  updateItem: async (payload: UpdateCartItemPayload): Promise<Cart> => {
    const response = await apiClient.post<{ success: boolean; data: Cart }>(API_CONFIG.HMS.PHARMACY.CART_UPDATE_ITEM, payload);
    return response.data.data;
  },
  removeItem: async (payload: RemoveFromCartPayload): Promise<Cart> => {
    const response = await apiClient.post<{ success: boolean; data: Cart }>(API_CONFIG.HMS.PHARMACY.CART_REMOVE_ITEM, payload);
    return response.data.data;
  },
  clearCart: async (): Promise<Cart> => {
    const response = await apiClient.post<{ success: boolean; data: Cart }>(API_CONFIG.HMS.PHARMACY.CART_CLEAR);
    return response.data.data;
  },
};

// ==================== PHARMACY ORDERS ====================
const pharmacyOrderService = {
  list: async (queryParams?: Record<string, any>): Promise<PaginatedResponse<PharmacyOrder>> => {
    const response = await apiClient.get(API_CONFIG.HMS.PHARMACY.ORDERS_LIST, { params: queryParams });
    return response.data;
  },
  retrieve: async (id: number): Promise<PharmacyOrder> => {
    const response = await apiClient.get(buildPath(API_CONFIG.HMS.PHARMACY.ORDER_DETAIL, { id }));
    return response.data;
  },
  create: async (payload: PharmacyOrderPayload): Promise<PharmacyOrder> => {
    const response = await apiClient.post<{ success: boolean; data: PharmacyOrder }>(API_CONFIG.HMS.PHARMACY.ORDER_CREATE, payload);
    return response.data.data;
  },
  update: async (id: number, payload: UpdatePharmacyOrderPayload): Promise<PharmacyOrder> => {
    const response = await apiClient.put(buildPath(API_CONFIG.HMS.PHARMACY.ORDER_UPDATE, { id }), payload);
    return response.data;
  },
  partialUpdate: async (id: number, payload: Partial<UpdatePharmacyOrderPayload>): Promise<PharmacyOrder> => {
    const response = await apiClient.patch(buildPath(API_CONFIG.HMS.PHARMACY.ORDER_PARTIAL_UPDATE, { id }), payload);
    return response.data;
  },
  destroy: async (id: number): Promise<void> => {
    const response = await apiClient.delete(buildPath(API_CONFIG.HMS.PHARMACY.ORDER_DELETE, { id }));
    return response.data;
  },
  cancel: async (id: number): Promise<PharmacyOrder> => {
    const response = await apiClient.post<{ success: boolean; data: PharmacyOrder }>(buildPath(API_CONFIG.HMS.PHARMACY.ORDER_CANCEL, { id }));
    return response.data.data;
  },
  getStatistics: async (): Promise<PharmacyOrderStats> => {
    const response = await apiClient.get<{ data: PharmacyOrderStats }>(API_CONFIG.HMS.PHARMACY.ORDERS_STATISTICS);
    return response.data.data;
  },
};

export {
  productCategoryService,
  pharmacyProductService,
  cartService,
  pharmacyOrderService,
};