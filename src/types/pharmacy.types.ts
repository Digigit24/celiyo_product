// src/types/pharmacy.types.ts

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryPayload {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface PharmacyProduct {
  id: number;
  product_name: string;
  category: ProductCategory;
  company: string;
  batch_no: string;
  mrp: string;
  selling_price: string;
  quantity: number;
  minimum_stock_level: number;
  expiry_date: string;
  is_active: boolean;
  is_in_stock: boolean;
  low_stock_warning: boolean;
  created_at: string;
  updated_at: string;
}

export interface PharmacyProductPayload {
  product_name: string;
  category: number;
  company?: string;
  batch_no?: string;
  mrp: number;
  selling_price: number;
  quantity: number;
  minimum_stock_level: number;
  expiry_date: string;
  is_active?: boolean;
}

export interface PharmacyProductStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  in_stock_products: number;
  out_of_stock_products: number;
  low_stock_products: number;
  near_expiry_products: number;
  expired_products: number;
  categories: number;
}

export interface CartItem {
  id: number;
  product: PharmacyProduct;
  quantity: number;
  price: string;
  total_price: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_cart_price: string;
  created_at: string;
  updated_at: string;
}

export interface AddToCartPayload {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemPayload {
  cart_item_id: number;
  quantity: number;
}

export interface RemoveFromCartPayload {
  cart_item_id: number;
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface PharmacyOrder {
  id: number;
  order_id: string;
  items: CartItem[];
  total_price: string;
  status: OrderStatus;
  patient_name: string;
  created_at: string;
  updated_at: string;
}

export interface PharmacyOrderPayload {
  cart_id: number;
  patient_name: string;
}

export interface UpdatePharmacyOrderPayload {
    status: OrderStatus;
}

export interface PharmacyOrderStats {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
}
