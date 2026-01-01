// src/hooks/useFormsApi.ts
// Custom hook for fetching leads from Forms API

import { useState, useEffect, useCallback } from 'react';
import { formsApiService, FormsSubmission, FormsClient, FormsAdminLoginResponse } from '@/services/formsApiService';

export interface UseFormsApiResult {
  submissions: FormsSubmission[];
  clients: FormsClient[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (userName: string, password: string) => Promise<FormsAdminLoginResponse>;
  fetchSubmissions: () => Promise<void>;
  fetchClients: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Hook to interact with Forms API
 * Automatically logs in with superadmin credentials on mount
 * and fetches all submissions
 */
export const useFormsApi = (autoFetch: boolean = true): UseFormsApiResult => {
  const [submissions, setSubmissions] = useState<FormsSubmission[]>([]);
  const [clients, setClients] = useState<FormsClient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  /**
   * Login to Forms API
   */
  const login = useCallback(async (userName: string, password: string): Promise<FormsAdminLoginResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await formsApiService.adminLogin(userName, password);
      setIsAuthenticated(true);

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to login to Forms API';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch all submissions
   */
  const fetchSubmissions = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await formsApiService.getAllSubmissions();
      setSubmissions(data);

      console.log('📊 Forms API - Submissions loaded:', {
        count: data.length,
        data
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch submissions';
      setError(errorMessage);
      console.error('❌ Error fetching submissions:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch all clients
   */
  const fetchClients = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await formsApiService.getAllClients();
      setClients(data);

      console.log('👥 Forms API - Clients loaded:', {
        count: data.length,
        data
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch clients';
      setError(errorMessage);
      console.error('❌ Error fetching clients:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout from Forms API
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await formsApiService.logout();
      setIsAuthenticated(false);
      setSubmissions([]);
      setClients([]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to logout';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-login and fetch on mount
   */
  useEffect(() => {
    if (!autoFetch) return;

    const autoLoginAndFetch = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Auto-login with superadmin credentials
        console.log('🔐 Forms API - Auto-logging in with superadmin credentials...');
        await formsApiService.autoLoginSuperadmin();
        setIsAuthenticated(true);

        // Fetch submissions
        console.log('📥 Forms API - Fetching submissions...');
        const submissionsData = await formsApiService.getAllSubmissions();
        setSubmissions(submissionsData);

        console.log('✅ Forms API - Auto-login and fetch completed');
        console.log('📊 Submissions:', submissionsData);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to auto-login or fetch data';
        setError(errorMessage);
        setIsAuthenticated(false);
        console.error('❌ Forms API - Auto-login/fetch failed:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    autoLoginAndFetch();
  }, [autoFetch]);

  return {
    submissions,
    clients,
    isLoading,
    error,
    isAuthenticated,
    login,
    fetchSubmissions,
    fetchClients,
    logout,
  };
};
