// src/hooks/whatsapp/useContacts.ts
import useSWR, { mutate } from 'swr';
import { contactsService } from '@/services/whatsapp/contactsService';
import {
  Contact,
  ContactsListQuery,
  CreateContactPayload,
  UpdateContactPayload,
} from '@/types/whatsappTypes';

// SWR key generators
const getContactsKey = (query?: ContactsListQuery) => 
  query ? ['contacts', query] : ['contacts'];

const getContactKey = (phone: string) => ['contact', phone];

/**
 * Hook to fetch all contacts
 */
export const useContacts = (query?: ContactsListQuery) => {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    getContactsKey(query),
    () => contactsService.getContacts(query),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    contacts: data?.contacts || [],
    total: data?.total || 0,
    isLoading,
    error,
    revalidate,
  };
};

/**
 * Hook to fetch a single contact
 */
export const useContact = (phone: string | null) => {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    phone ? getContactKey(phone) : null,
    () => (phone ? contactsService.getContact(phone) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    contact: data || null,
    isLoading,
    error,
    revalidate,
  };
};

/**
 * Hook for contact mutations (create, update, delete)
 */
export const useContactMutations = () => {
  const createContact = async (payload: CreateContactPayload): Promise<Contact> => {
    try {
      const newContact = await contactsService.createContact(payload);
      
      // Revalidate all contacts lists
      mutate(
        (key) => Array.isArray(key) && key[0] === 'contacts',
        undefined,
        { revalidate: true }
      );
      
      return newContact;
    } catch (error: any) {
      throw error;
    }
  };

  const updateContact = async (phone: string, payload: UpdateContactPayload): Promise<Contact> => {
    try {
      const updatedContact = await contactsService.updateContact(phone, payload);
      
      // Revalidate specific contact
      mutate(getContactKey(phone), updatedContact, false);
      
      // Revalidate all contacts lists
      mutate(
        (key) => Array.isArray(key) && key[0] === 'contacts',
        undefined,
        { revalidate: true }
      );
      
      return updatedContact;
    } catch (error: any) {
      throw error;
    }
  };

  const deleteContact = async (phone: string): Promise<void> => {
    try {
      await contactsService.deleteContact(phone);
      
      // Remove from cache
      mutate(getContactKey(phone), undefined, false);
      
      // Revalidate all contacts lists
      mutate(
        (key) => Array.isArray(key) && key[0] === 'contacts',
        undefined,
        { revalidate: true }
      );
    } catch (error: any) {
      throw error;
    }
  };

  return {
    createContact,
    updateContact,
    deleteContact,
  };
};

/**
 * Hook to search contacts
 */
export const useContactSearch = (searchQuery: string, limit: number = 20) => {
  const { data, error, isLoading } = useSWR(
    searchQuery ? ['contacts', 'search', searchQuery, limit] : null,
    () => (searchQuery ? contactsService.searchContacts(searchQuery, limit) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 500, // Debounce searches
    }
  );

  return {
    contacts: data?.contacts || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
};

/**
 * Hook to get contacts by label
 */
export const useContactsByLabel = (label: string | null, limit: number = 100) => {
  const { data, error, isLoading } = useSWR(
    label ? ['contacts', 'label', label, limit] : null,
    () => (label ? contactsService.getContactsByLabel(label, limit) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    contacts: data?.contacts || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
};

/**
 * Hook to get contacts by group
 */
export const useContactsByGroup = (group: string | null, limit: number = 100) => {
  const { data, error, isLoading } = useSWR(
    group ? ['contacts', 'group', group, limit] : null,
    () => (group ? contactsService.getContactsByGroup(group, limit) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    contacts: data?.contacts || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
};