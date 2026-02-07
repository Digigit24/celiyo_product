// src/types/pharmacy.types.ts

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Category Types
export type CategoryType = 'medicine' | 'healthcare_product' | 'medical_equipment';

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  type: CategoryType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryPayload {
  name: string;
  description?: string;
  type: CategoryType;
  is_active?: boolean;
}

// Product Types
export interface PharmacyProduct {
  id: number;
  product_name: string;
  category?: ProductCategory;
  category_id?: number;
  company?: string;
  batch_no?: string;
  mrp: string | number;
  selling_price?: string | number;
  quantity: number;
  minimum_stock_level: number;
  expiry_date?: string;
  is_active: boolean;
  is_in_stock: boolean;
  low_stock_warning: boolean;
  created_at: string;
  updated_at: string;
}

export interface PharmacyProductPayload {
  product_name: string;
  category_id?: number;
  company?: string;
  batch_no?: string;
  mrp: number | string;
  selling_price?: number | string;
  quantity: number;
  minimum_stock_level: number;
  expiry_date?: string;
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

// Cart Types
export interface CartItem {
  id: number;
  product: PharmacyProduct;
  product_id: number;
  quantity: number;
  price_at_time: string | number;
  total_price: string | number;
}

export interface Cart {
  id: number;
  user_id: string;
  cart_items: CartItem[];
  total_items: number;
  total_amount: string | number;
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

// Order Types
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface PharmacyOrderItem {
  id: number;
  product: PharmacyProduct;
  quantity: number;
  price_at_time: string | number;
  total_price: string | number;
}

export interface PharmacyOrder {
  id: number;
  user_id?: string;
  total_amount: string | number;
  status: OrderStatus;
  status_display: string;
  payment_status: PaymentStatus;
  payment_status_display: string;
  shipping_address: string;
  billing_address: string;
  created_at: string;
  updated_at: string;
  order_items: PharmacyOrderItem[];
}

export interface PharmacyOrderPayload {
  shipping_address: string;
  billing_address: string;
}

export interface UpdatePharmacyOrderPayload {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
}

export interface PharmacyOrderStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_spent: string | number;
}
