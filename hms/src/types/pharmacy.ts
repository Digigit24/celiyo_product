// src/types/pharmacy.ts

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  type: string; // 'medicine' for example
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PharmacyProduct {
  id: number;
  product_name: string;
  category: ProductCategory | null;
  company?: string;
  batch_no?: string;
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

export interface PharmacyProductStats {
  total_products: number;
  low_stock_count: number;
  expired_count: number;
  near_expiry_count: number;
}
