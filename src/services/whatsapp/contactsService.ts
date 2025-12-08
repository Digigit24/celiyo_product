// src/services/whatsapp/contactsService.ts
import { whatsappClient } from '@/lib/whatsappClient';
import { API_CONFIG, buildUrl, buildQueryString } from '@/lib/apiConfig';
import {
  Contact,
  ContactsListQuery,
  ContactsListResponse,
  CreateContactPayload,
  UpdateContactPayload,
  DeleteContactResponse,
} from '@/types/whatsappTypes';

class ContactsService {
  /**
   * Get all contacts with optional filters
   */
  async getContacts(query?: ContactsListQuery): Promise<ContactsListResponse> {
    try {
      console.log('📋 Fetching contacts:', query);
  
      const queryString = buildQueryString(query as unknown as Record<string, string | number | boolean>);
      const url = `${API_CONFIG.WHATSAPP.CONTACTS}${queryString}`;
  
      // Don't force a response type here so we can normalize various shapes safely
      const response = await whatsappClient.get(url);
      const raw = response.data;
  
      // Normalize API response to { total, contacts }
      let normalized: ContactsListResponse;
  
      if (Array.isArray(raw)) {
        // Backend returns a plain array of contacts
        normalized = {
          total: raw.length,
          contacts: raw as Contact[],
        };
      } else if (raw && typeof raw === 'object') {
        if (Array.isArray((raw as any).contacts)) {
          // Expected shape already
          normalized = {
            total: (raw as any).total ?? (raw as any).contacts.length,
            contacts: (raw as any).contacts as Contact[],
          };
        } else if (Array.isArray((raw as any).results)) {
          // Common alternative { count, results }
          normalized = {
            total: (raw as any).count ?? (raw as any).results.length,
            contacts: (raw as any).results as Contact[],
          };
        } else {
          // Fallback: try to find the first array field
          const firstArray = Object.values(raw).find((v) => Array.isArray(v)) as Contact[] | undefined;
          normalized = {
            total: firstArray?.length ?? 0,
            contacts: (firstArray as Contact[]) ?? [],
          };
        }
      } else {
        // Unknown/empty shape
        normalized = { total: 0, contacts: [] };
      }
  
      console.log('✅ Contacts fetched:', {
        total: normalized.total,
        count: normalized.contacts.length,
      });
  
      return normalized;
    } catch (error: any) {
      console.error('❌ Failed to fetch contacts:', error);
      const message = error.response?.data?.detail || error.message || 'Failed to fetch contacts';
      throw new Error(message);
    }
  }

  /**
   * Get single contact by phone number
   */
  async getContact(phone: string): Promise<Contact> {
    try {
      console.log('📋 Fetching contact:', phone);
      
      const url = buildUrl(
        API_CONFIG.WHATSAPP.CONTACT_DETAIL,
        { phone },
        'whatsapp'
      );
      
      const response = await whatsappClient.get<Contact>(url);
      
      console.log('✅ Contact fetched:', response.data.name || response.data.phone);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch contact:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Contact not found');
      }
      
      const message = error.response?.data?.detail || 'Failed to fetch contact';
      throw new Error(message);
    }
  }

  /**
   * Create a new contact
   */
  async createContact(payload: CreateContactPayload): Promise<Contact> {
    try {
      console.log('➕ Creating contact:', payload.phone);
      
      const response = await whatsappClient.post<Contact>(
        API_CONFIG.WHATSAPP.CONTACT_CREATE,
        payload
      );
      
      console.log('✅ Contact created:', response.data.phone);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create contact:', error);
      
      if (error.response?.status === 409) {
        throw new Error('Contact already exists');
      }
      
      const message = error.response?.data?.detail || 'Failed to create contact';
      throw new Error(message);
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(phone: string, payload: UpdateContactPayload): Promise<Contact> {
    try {
      console.log('✏️ Updating contact:', phone);
      
      const url = buildUrl(
        API_CONFIG.WHATSAPP.CONTACT_UPDATE,
        { phone },
        'whatsapp'
      );
      
      const response = await whatsappClient.put<Contact>(url, payload);
      
      console.log('✅ Contact updated:', response.data.phone);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update contact:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Contact not found');
      }
      
      const message = error.response?.data?.detail || 'Failed to update contact';
      throw new Error(message);
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(phone: string): Promise<DeleteContactResponse> {
    try {
      console.log('🗑️ Deleting contact:', phone);
      
      const url = buildUrl(
        API_CONFIG.WHATSAPP.CONTACT_DELETE,
        { phone },
        'whatsapp'
      );
      
      const response = await whatsappClient.delete<DeleteContactResponse>(url);
      
      console.log('✅ Contact deleted:', response.data.phone);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to delete contact:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Contact not found');
      }
      
      const message = error.response?.data?.detail || 'Failed to delete contact';
      throw new Error(message);
    }
  }

  /**
   * Search contacts by name or phone
   */
  async searchContacts(searchQuery: string, limit: number = 20): Promise<ContactsListResponse> {
    return this.getContacts({
      search: searchQuery,
      limit,
    });
  }

  /**
   * Get contacts by label
   */
  async getContactsByLabel(label: string, limit: number = 100): Promise<ContactsListResponse> {
    return this.getContacts({
      labels: label,
      limit,
    });
  }

  /**
   * Get contacts by group
   */
  async getContactsByGroup(group: string, limit: number = 100): Promise<ContactsListResponse> {
    return this.getContacts({
      groups: group,
      limit,
    });
  }
}

export const contactsService = new ContactsService();