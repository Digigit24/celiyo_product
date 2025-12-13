// src/lib/client.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './apiConfig';

// Token management for JWT tokens
const ACCESS_TOKEN_KEY = 'celiyo_access_token';
const REFRESH_TOKEN_KEY = 'celiyo_refresh_token';
const USER_KEY = 'celiyo_user';

export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  setAccessToken: (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  
  removeTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  hasAccessToken: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // Legacy methods for backward compatibility
  getToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  setToken: (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  
  removeToken: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
  
  hasToken: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }
};

// Create auth client for authentication API (port 8000)
const authClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.AUTH_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create CRM client for CRM API (port 8001)
const crmClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.CRM_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create HMS client for HMS API (port 8000)
const hmsClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.HMS_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth client - attach token and tenant headers
authClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();

      url: config.url,
      method: config.method?.toUpperCase(),
      hasToken: !!token
    });

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
            config.headers['x-tenant-id'] = tenantId; // Backend expects lowercase
            config.headers['tenanttoken'] = tenantId; // Your API uses 'tenanttoken' header

              'X-Tenant-Id': tenantId,
              'x-tenant-id': tenantId,
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

// Request interceptor for CRM client - attach token and tenant headers
crmClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    
      url: config.url,
      method: config.method?.toUpperCase(),
      hasToken: !!token
    });
    
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

// Request interceptor for HMS client - attach token and tenant headers
hmsClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    
      url: config.url,
      method: config.method?.toUpperCase(),
      hasToken: !!token
    });
    
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

// Response interceptor for auth client
authClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      tokenManager.removeTokens();
      localStorage.removeItem(USER_KEY);
      
      // Only redirect to login if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
    }
    
    // Handle network errors
    if (!error.response) {
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor for CRM client
crmClient.interceptors.response.use(
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

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;


      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
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
          return crmClient(originalRequest);
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

    // Handle 403 Forbidden - CRM module not enabled
    if (error.response?.status === 403) {
    }
    
    // Handle network errors
    if (!error.response) {
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor for HMS client
hmsClient.interceptors.response.use(
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

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;


      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
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
          return hmsClient(originalRequest);
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

    // Handle 403 Forbidden - HMS module not enabled
    if (error.response?.status === 403) {
    }
    
    // Handle network errors
    if (!error.response) {
    }
    
    return Promise.reject(error);
  }
);

// Export all clients
export { authClient, crmClient, hmsClient };

// Export auth client as default for backward compatibility
export default authClient;