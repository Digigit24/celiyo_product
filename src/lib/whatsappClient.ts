// src/lib/whatsappClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './apiConfig';
import { tokenManager } from './client';

const USER_KEY = 'celiyo_user';

// Create WhatsApp client for WhatsApp API (port 8002)
const whatsappClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.WHATSAPP_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for WhatsApp client - attach token and tenant headers
whatsappClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
    }

    // Multi-tenant header propagation (read from stored user)
    try {
      const userJson = localStorage.getItem(USER_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        const tenant = user?.tenant;
        
        if (tenant) {
          // Get tenant ID (could be tenant.id or tenant.tenant_id)
          const tenantId = tenant.id || tenant.tenant_id;
          
          if (tenantId) {
            config.headers['X-Tenant-Id'] = tenantId;
            config.headers['tenanttoken'] = tenantId; // Your API uses 'tenanttoken' header
            
              'X-Tenant-Id': tenantId,
              'tenanttoken': tenantId
            });
          }
          
          if (tenant.slug) {
            config.headers['X-Tenant-Slug'] = tenant.slug;
          }
        } else {
        }
      } else {
      }
    } catch (error) {
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for WhatsApp client
whatsappClient.interceptors.response.use(
  (response) => {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });

    // Handle 401 Unauthorized - token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;


      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          // Import authClient dynamically to avoid circular dependency
          const { authClient } = await import('./client');
          
          // Try to refresh the token using auth client
          const response = await authClient.post(API_CONFIG.AUTH.REFRESH, {
            refresh: refreshToken
          });

          const { access, refresh } = response.data;
          tokenManager.setAccessToken(access);
          
          // Update refresh token if provided
          if (refresh) {
            tokenManager.setRefreshToken(refresh);
          }


          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return whatsappClient(originalRequest);
        }
      } catch (refreshError) {
        
        // Refresh failed, clear tokens and redirect to login
        tokenManager.removeTokens();
        localStorage.removeItem(USER_KEY);
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden - WhatsApp module not enabled
    if (error.response?.status === 403) {
      
      // Check if it's a module access issue
      if (error.response.data?.detail?.includes('whatsapp module not enabled')) {
      }
    }
    
    // Handle network errors
    if (!error.response) {
    }
    
    return Promise.reject(error);
  }
);

export { whatsappClient };