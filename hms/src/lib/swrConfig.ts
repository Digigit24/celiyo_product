// src/lib/swrConfig.ts
import { SWRConfiguration } from 'swr';
import { hmsClient } from './client';
import { AxiosError } from 'axios';

// Generic fetcher for SWR using HMS client
export const fetcher = async <T = any>(url: string): Promise<T> => {
  try {
    const response = await hmsClient.get<T>(url);

    // Handle Django-style responses with nested data
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as any).data;
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError;
  }
};

// POST fetcher for mutations
export const postFetcher = async <T = any>(url: string, { arg }: { arg: any }): Promise<T> => {
  const response = await hmsClient.post<T>(url, arg);

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as any).data;
  }

  return response.data;
};

// PUT fetcher for mutations
export const putFetcher = async <T = any>(url: string, { arg }: { arg: any }): Promise<T> => {
  const response = await hmsClient.put<T>(url, arg);

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as any).data;
  }

  return response.data;
};

// PATCH fetcher for mutations
export const patchFetcher = async <T = any>(url: string, { arg }: { arg: any }): Promise<T> => {
  const response = await hmsClient.patch<T>(url, arg);

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as any).data;
  }

  return response.data;
};

// DELETE fetcher for mutations
export const deleteFetcher = async <T = any>(url: string): Promise<T> => {
  const response = await hmsClient.delete<T>(url);

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as any).data;
  }

  return response.data;
};

// Default SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onError: (error: AxiosError) => {
    // Handle specific error codes globally
    if (error.response?.status === 401) {
      console.error('Authentication error - token may be invalid');
    }
    
    if (error.response?.status === 403) {
      console.error('Permission denied');
    }
    
    if (error.response?.status === 500) {
      console.error('Server error');
    }
  },
};