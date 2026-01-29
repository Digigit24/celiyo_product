// src/services/whatsapp/contactsService.ts
// Updated to use external Laravel API via externalWhatsappService

import { externalWhatsappService } from '@/services/externalWhatsappService';
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
   * Map Laravel API contact response to frontend Contact format
   */
  private mapLaravelContact(laravelContact: any): Contact {
    return {
      id: laravelContact._uid || laravelContact.id,
      phone: laravelContact.phone_number || laravelContact.phone || laravelContact.wa_id || '',
      name: laravelContact.first_name
        ? `${laravelContact.first_name} ${laravelContact.last_name || ''}`.trim()
        : laravelContact.name || '',
      first_name: laravelContact.first_name || '',
      last_name: laravelContact.last_name || '',
      email: laravelContact.email || '',
      country: laravelContact.country || '',
      language_code: laravelContact.language_code || '',
      labels: laravelContact.labels || [],
      groups: laravelContact.groups || [],
      custom_fields: laravelContact.custom_fields || {},
      created_at: laravelContact.created_at || new Date().toISOString(),
      updated_at: laravelContact.updated_at || new Date().toISOString(),
      last_message_at: laravelContact.last_message_at,
      is_blocked: laravelContact.is_blocked || false,
      avatar_url: laravelContact.avatar_url || laravelContact.profile_picture,
    } as Contact;
  }

  /**
   * Normalize phone number (remove leading +)
   */
  private normalizePhoneParam(phone: string) {
    return phone.replace(/^\+/, '');
  }

  /**
   * Get all contacts with optional filters using external Laravel API
   */
  async getContacts(query?: ContactsListQuery): Promise<ContactsListResponse> {
    try {
      console.log('📋 Fetching contacts via external API:', query);

      // Call external API
      const response = await externalWhatsappService.getContacts({
        page: query?.page,
        limit: query?.limit,
        search: query?.search,
      });

      // Normalize response - Laravel API may return different formats
      const raw = response;
      let contacts: any[] = [];
      let total = 0;

      if (Array.isArray(raw)) {
        contacts = raw;
        total = raw.length;
      } else if (raw?.data && Array.isArray(raw.data)) {
        contacts = raw.data;
        total = raw.total || raw.data.length;
      } else if (raw?.contacts && Array.isArray(raw.contacts)) {
        contacts = raw.contacts;
        total = raw.total || raw.contacts.length;
      } else if (raw && typeof raw === 'object') {
        // Try to find the first array field
        const firstArray = Object.values(raw).find((v) => Array.isArray(v)) as any[] | undefined;
        contacts = firstArray || [];
        total = (raw as any).total || contacts.length;
      }

      // Map to frontend format
      const mappedContacts = contacts.map((c: any) => this.mapLaravelContact(c));

      console.log('✅ Contacts fetched:', {
        total,
        count: mappedContacts.length,
      });

      return {
        total,
        contacts: mappedContacts,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch contacts:', error);
      const message = error.message || 'Failed to fetch contacts';
      throw new Error(message);
    }
  }

  /**
   * Get single contact by phone number or UID using external Laravel API
   */
  async getContact(phoneOrUid: string): Promise<Contact> {
    try {
      console.log('📋 Fetching contact via external API:', phoneOrUid);
      const cleanPhone = this.normalizePhoneParam(phoneOrUid);

      const response = await externalWhatsappService.getContact(cleanPhone);

      // Map to frontend format
      const contact = response?.data || response;
      const mappedContact = this.mapLaravelContact(contact);

      console.log('✅ Contact fetched:', mappedContact.name || mappedContact.phone);

      return mappedContact;
    } catch (error: any) {
      console.error('❌ Failed to fetch contact:', error);

      if (error.message?.includes('not found')) {
        throw new Error('Contact not found');
      }

      const message = error.message || 'Failed to fetch contact';
      throw new Error(message);
    }
  }

  /**
   * Create a new contact using external Laravel API
   */
  async createContact(payload: CreateContactPayload): Promise<Contact> {
    try {
      console.log('➕ Creating contact via external API:', payload.phone);

      // Map frontend payload to Laravel API format
      const laravelPayload = {
        phone_number: payload.phone,
        first_name: payload.name?.split(' ')[0] || payload.first_name || '',
        last_name: payload.name?.split(' ').slice(1).join(' ') || payload.last_name || '',
        email: payload.email,
        country: payload.country,
        language_code: payload.language_code,
        groups: payload.groups?.join(','),
        custom_fields: payload.custom_fields,
      };

      const response = await externalWhatsappService.createContact(laravelPayload);

      // Map to frontend format
      const contact = response?.data || response;
      const mappedContact = this.mapLaravelContact(contact);

      console.log('✅ Contact created:', mappedContact.phone);

      return mappedContact;
    } catch (error: any) {
      console.error('❌ Failed to create contact:', error);

      if (error.message?.includes('already exists') || error.message?.includes('409')) {
        throw new Error('Contact already exists');
      }

      const message = error.message || 'Failed to create contact';
      throw new Error(message);
    }
  }

  /**
   * Update an existing contact using external Laravel API
   */
  async updateContact(phone: string, payload: UpdateContactPayload): Promise<Contact> {
    try {
      console.log('✏️ Updating contact via external API:', phone);
      const cleanPhone = this.normalizePhoneParam(phone);

      // Map frontend payload to Laravel API format
      const laravelPayload: any = {};

      if (payload.name) {
        laravelPayload.first_name = payload.name.split(' ')[0];
        laravelPayload.last_name = payload.name.split(' ').slice(1).join(' ');
      }
      if (payload.first_name !== undefined) laravelPayload.first_name = payload.first_name;
      if (payload.last_name !== undefined) laravelPayload.last_name = payload.last_name;
      if (payload.email !== undefined) laravelPayload.email = payload.email;
      if (payload.country !== undefined) laravelPayload.country = payload.country;
      if (payload.language_code !== undefined) laravelPayload.language_code = payload.language_code;
      if (payload.groups !== undefined) laravelPayload.groups = Array.isArray(payload.groups) ? payload.groups.join(',') : payload.groups;
      if (payload.custom_fields !== undefined) laravelPayload.custom_fields = payload.custom_fields;

      const response = await externalWhatsappService.updateContact(cleanPhone, laravelPayload);

      // Map to frontend format
      const contact = response?.data || response;
      const mappedContact = this.mapLaravelContact(contact);

      console.log('✅ Contact updated:', mappedContact.phone);

      return mappedContact;
    } catch (error: any) {
      console.error('❌ Failed to update contact:', error);

      if (error.message?.includes('not found')) {
        throw new Error('Contact not found');
      }

      const message = error.message || 'Failed to update contact';
      throw new Error(message);
    }
  }

  /**
   * Delete a contact using external Laravel API
   */
  async deleteContact(phone: string): Promise<DeleteContactResponse> {
    try {
      console.log('🗑️ Deleting contact via external API:', phone);
      const cleanPhone = this.normalizePhoneParam(phone);

      await externalWhatsappService.deleteContact(cleanPhone);

      console.log('✅ Contact deleted:', cleanPhone);

      return { phone: cleanPhone, deleted: true };
    } catch (error: any) {
      console.error('❌ Failed to delete contact:', error);

      if (error.message?.includes('not found')) {
        throw new Error('Contact not found');
      }

      const message = error.message || 'Failed to delete contact';
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
    // Get all contacts and filter by label
    const result = await this.getContacts({ limit });
    const filteredContacts = result.contacts.filter((contact) =>
      contact.labels?.includes(label)
    );
    return {
      total: filteredContacts.length,
      contacts: filteredContacts,
    };
  }

  /**
   * Get contacts by group
   */
  async getContactsByGroup(group: string, limit: number = 100): Promise<ContactsListResponse> {
    // Get all contacts and filter by group
    const result = await this.getContacts({ limit });
    const filteredContacts = result.contacts.filter((contact) =>
      contact.groups?.includes(group)
    );
    return {
      total: filteredContacts.length,
      contacts: filteredContacts,
    };
  }

  /**
   * Get all labels using external Laravel API
   */
  async getLabels(): Promise<string[]> {
    try {
      console.log('🏷️ Fetching labels via external API');

      const response = await externalWhatsappService.getLabels();

      // Normalize response
      let labels: any[] = [];
      if (Array.isArray(response)) {
        labels = response;
      } else if (response?.data && Array.isArray(response.data)) {
        labels = response.data;
      } else if (response?.labels && Array.isArray(response.labels)) {
        labels = response.labels;
      }

      // Extract label names
      const labelNames = labels.map((l: any) =>
        typeof l === 'string' ? l : (l.name || l.title || l.label || '')
      ).filter(Boolean);

      console.log('✅ Labels fetched:', labelNames.length);

      return labelNames;
    } catch (error: any) {
      console.error('❌ Failed to fetch labels:', error);
      return [];
    }
  }

  /**
   * Get all contact groups using external Laravel API
   */
  async getContactGroups(): Promise<any[]> {
    try {
      console.log('👥 Fetching contact groups via external API');

      const response = await externalWhatsappService.getContactGroups();

      // Normalize response
      let groups: any[] = [];
      if (Array.isArray(response)) {
        groups = response;
      } else if (response?.data && Array.isArray(response.data)) {
        groups = response.data;
      } else if (response?.groups && Array.isArray(response.groups)) {
        groups = response.groups;
      }

      console.log('✅ Contact groups fetched:', groups.length);

      return groups;
    } catch (error: any) {
      console.error('❌ Failed to fetch contact groups:', error);
      return [];
    }
  }

  /**
   * Import contacts from Excel file
   * Note: This may need to be implemented via a different endpoint
   */
  async importContacts(file: File): Promise<string> {
    try {
      console.log('📤 Importing contacts from file:', file.name);

      // This needs to be implemented based on Laravel API endpoints
      // For now, throw an error indicating this needs implementation
      throw new Error('Contact import not yet implemented for external API. Please use the Laravel admin panel.');
    } catch (error: any) {
      console.error('❌ Failed to import contacts:', error);
      throw error;
    }
  }
}

export const contactsService = new ContactsService();
