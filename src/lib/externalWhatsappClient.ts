// src/lib/externalWhatsappClient.ts
// External WhatsApp client for Laravel API (whatsappapi.celiyo.com/api)
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './apiConfig';
import { tokenManager } from './client';

const USER_KEY = 'celiyo_user';

// Create external WhatsApp client for Laravel API
const externalWhatsappClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.WHATSAPP_EXTERNAL_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach Bearer token
externalWhatsappClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    
    console.log('📤 External WhatsApp API Request:', {
      url: config.url,
      method: config.method?.toUpperCase(),
      hasToken: !!token
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added Bearer token to external WhatsApp request');
    } else {
      console.warn('⚠️ No access token found for external WhatsApp request!');
    }

    // Add tenant headers if available
    try {
      const userJson = localStorage.getItem(USER_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        const tenant = user?.tenant;
        
        if (tenant) {
          const tenantId = tenant.id || tenant.tenant_id;
          
          if (tenantId) {
            config.headers['X-Tenant-Id'] = tenantId;
            config.headers['tenanttoken'] = tenantId;
            
            console.log('🏢 Added tenant headers to external WhatsApp request:', {
              'X-Tenant-Id': tenantId,
              'tenanttoken': tenantId
            });
          }
          
          if (tenant.slug) {
            config.headers['X-Tenant-Slug'] = tenant.slug;
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse user or attach tenant headers:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
externalWhatsappClient.interceptors.response.use(
  (response) => {
    console.log('✅ External WhatsApp API response:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('❌ External WhatsApp API error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });

    // Handle 401 Unauthorized - token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('🔄 Attempting to refresh token for external WhatsApp request...');

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const { authClient } = await import('./client');
          
          const response = await authClient.post(API_CONFIG.AUTH.REFRESH, {
            refresh: refreshToken
          });

          const { access, refresh } = response.data;
          tokenManager.setAccessToken(access);
          
          if (refresh) {
            tokenManager.setRefreshToken(refresh);
          }

          console.log('✅ Token refreshed, retrying external WhatsApp request');

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return externalWhatsappClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        tokenManager.removeTokens();
        localStorage.removeItem(USER_KEY);
        
        if (!window.location.pathname.includes('/login')) {
          console.log('↪️ Redirecting to login...');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('🚫 External WhatsApp access forbidden:', error.response.data);
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Get vendor UID from localStorage
 */
export const getVendorUid = (): string | null => {
  try {
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      const user = JSON.parse(userJson);
      return user?.vendor_uid || user?.tenant?.vendor_uid || null;
    }
  } catch (error) {
    console.error('Failed to get vendor UID:', error);
  }
  return null;
};

/**
 * Build URL with vendor UID
 */
export const buildExternalWhatsAppUrl = (
  endpoint: string,
  params?: Record<string, string | number>
): string => {
  const vendorUid = getVendorUid();
  
  if (!vendorUid && endpoint.includes(':vendorUid')) {
    throw new Error('Vendor UID not found. Please ensure user is logged in.');
  }
  
  let url = endpoint;
  
  // Replace vendorUid first
  if (vendorUid) {
    url = url.replace(':vendorUid', vendorUid);
  }
  
  // Replace other parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      const encoded = encodeURIComponent(String(value));
      url = url.replace(`:${key}`, encoded);
    });
  }
  
  return url;
};

export { externalWhatsappClient };
