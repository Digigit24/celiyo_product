// src/services/formsApiService.ts
// Service for integrating with the external Forms API
// Base URL: https://forms.thedigitechsolutions.com/api

import axios, { AxiosInstance } from 'axios';

// Types for Forms API
export interface FormsAdminLoginPayload {
  userName: string;
  password: string;
}

export interface FormsAdminLoginResponse {
  success: boolean;
  message: string;
  role: string;
  user: {
    id: string;
    userName: string;
    email: string;
  };
}

export interface FormsSubmission {
  _id: string;
  clientID: string;
  data: Record<string, any>;
  createdAt: string;
}

export interface FormsClient {
  _id: string;
  clientID: string;
  userName: string;
  email: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

class FormsApiService {
  private client: AxiosInstance;
  private baseURL: string;
  private isAuthenticated: boolean = false;

  constructor() {
    this.baseURL = import.meta.env.VITE_FORMS_API_BASE_URL || 'https://forms.thedigitechsolutions.com/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for cookie-based authentication
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Forms API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Admin Login
   * Endpoint: POST /auth/admin/login
   */
  async adminLogin(userName: string, password: string): Promise<FormsAdminLoginResponse> {
    try {
      console.log('🔐 Forms API - Admin Login attempt:', { userName });

      const response = await this.client.post<FormsAdminLoginResponse>(
        '/auth/admin/login',
        { userName, password }
      );

      console.log('✅ Forms API - Admin Login successful:', response.data);
      this.isAuthenticated = true;

      return response.data;
    } catch (error: any) {
      console.error('❌ Forms API - Admin Login failed:', error.response?.data || error.message);
      this.isAuthenticated = false;
      throw error;
    }
  }

  /**
   * Auto-login with superadmin credentials from environment
   */
  async autoLoginSuperadmin(): Promise<FormsAdminLoginResponse> {
    const userName = import.meta.env.VITE_FORMS_SUPERADMIN_USERNAME || 'superadmin';
    const password = import.meta.env.VITE_FORMS_SUPERADMIN_PASSWORD || 'Letmegoin@0007';

    return this.adminLogin(userName, password);
  }

  /**
   * Get All Submissions
   * Endpoint: GET /admin/submissions
   */
  async getAllSubmissions(): Promise<FormsSubmission[]> {
    try {
      console.log('📥 Forms API - Fetching all submissions...');

      const response = await this.client.get<FormsSubmission[]>('/admin/submissions');

      console.log('✅ Forms API - Submissions fetched:', {
        count: response.data.length,
        submissions: response.data
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Forms API - Failed to fetch submissions:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get All Clients
   * Endpoint: GET /admin/clients
   */
  async getAllClients(): Promise<FormsClient[]> {
    try {
      console.log('👥 Forms API - Fetching all clients...');

      const response = await this.client.get<FormsClient[]>('/admin/clients');

      console.log('✅ Forms API - Clients fetched:', {
        count: response.data.length,
        clients: response.data
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Forms API - Failed to fetch clients:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Logout
   * Endpoint: POST /auth/logout
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout', {});
      this.isAuthenticated = false;
      console.log('👋 Forms API - Logged out successfully');
    } catch (error: any) {
      console.error('❌ Forms API - Logout failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check if authenticated
   */
  getAuthStatus(): boolean {
    return this.isAuthenticated;
  }
}

// Export singleton instance
export const formsApiService = new FormsApiService();
