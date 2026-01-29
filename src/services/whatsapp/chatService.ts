// src/services/whatsapp/chatService.ts
import { externalWhatsappService } from '@/services/externalWhatsappService';

// ==================== TYPE DEFINITIONS ====================

export interface ChatContact {
  _uid: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  is_online?: boolean;
  assigned_user_uid?: string;
  assigned_user_name?: string;
  labels?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  _uid: string;
  contact_uid: string;
  direction: 'incoming' | 'outgoing';
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'template' | 'interactive';
  message_body?: string;
  media_url?: string;
  media_type?: string;
  template_name?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface UnreadCount {
  total: number;
  contacts: Record<string, number>;
}

export interface TeamMember {
  _uid: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

export interface ChatContactsResponse {
  contacts: ChatContact[];
  total: number;
  page: number;
  limit: number;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  contact: ChatContact;
}

export interface SendMessageResponse {
  message_uid: string;
  status: string;
}

// ==================== CHAT SERVICE ====================

class ChatService {
  // Extract message text from various formats
  private extractLastMessage(lastMessage: any): string {
    if (!lastMessage) return '';
    // If it's already a string, return it
    if (typeof lastMessage === 'string') return lastMessage;
    // If it's an object like {message, is_incoming, messaged_at}
    if (typeof lastMessage === 'object') {
      return lastMessage.message || lastMessage.text || lastMessage.body || lastMessage.message_body || '';
    }
    return String(lastMessage);
  }

  // Extract last message timestamp from various formats
  private extractLastMessageTime(data: any): string | undefined {
    // Check for direct timestamp fields first
    if (data.last_message_at) return data.last_message_at;
    if (data.last_message_time) return data.last_message_time;
    // Check if last_message is an object with messaged_at
    if (data.last_message && typeof data.last_message === 'object') {
      return data.last_message.messaged_at || data.last_message.timestamp || data.last_message.created_at;
    }
    return data.updated_at;
  }

  private normalizeContact(data: any): ChatContact {
    return {
      _uid: data._uid || data.id || data.contact_uid,
      phone_number: data.phone_number || data.phone || data.wa_id || '',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      name: data.name || (data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : data.phone_number),
      email: data.email,
      avatar_url: data.avatar_url || data.profile_picture,
      last_message: this.extractLastMessage(data.last_message) || data.last_message_text || '',
      last_message_at: this.extractLastMessageTime(data),
      unread_count: data.unread_count || 0,
      is_online: data.is_online || false,
      assigned_user_uid: data.assigned_user_uid || data.assigned_to,
      assigned_user_name: data.assigned_user_name,
      labels: data.labels || [],
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  private normalizeMessage(data: any): ChatMessage {
    return {
      _uid: data._uid || data.id || data.message_uid,
      contact_uid: data.contact_uid || data.contact_id,
      direction: data.direction || (data.is_outgoing ? 'outgoing' : 'incoming'),
      message_type: data.message_type || data.type || 'text',
      message_body: data.message_body || data.text || data.body || '',
      media_url: data.media_url,
      media_type: data.media_type,
      template_name: data.template_name,
      status: data.status || data.delivery_status,
      created_at: data.created_at || data.timestamp || new Date().toISOString(),
      updated_at: data.updated_at,
      metadata: data.metadata || data.meta_data,
    };
  }

  // ==================== INBOX METHODS ====================

  async getChatContacts(params?: { page?: number; limit?: number; search?: string }): Promise<ChatContactsResponse> {
    const response = await externalWhatsappService.getChatContacts(params);

    let contacts: any[] = [];
    let total = 0;

    if (Array.isArray(response)) {
      contacts = response;
      total = response.length;
    } else if (response?.data) {
      contacts = Array.isArray(response.data) ? response.data : [];
      total = response.total || contacts.length;
    } else if (response?.contacts) {
      contacts = response.contacts;
      total = response.total || contacts.length;
    }

    return {
      contacts: contacts.map((c: any) => this.normalizeContact(c)),
      total,
      page: params?.page || 1,
      limit: params?.limit || 50,
    };
  }

  async getUnreadCount(): Promise<UnreadCount> {
    try {
      const response = await externalWhatsappService.getUnreadCount();
      return {
        total: response?.total || response?.unread_count || 0,
        contacts: response?.contacts || response?.per_contact || {},
      };
    } catch (error) {
      // Fail gracefully - return zeros if endpoint fails
      console.warn('Failed to fetch unread count:', error);
      return { total: 0, contacts: {} };
    }
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    const response = await externalWhatsappService.getTeamMembers();
    const members = Array.isArray(response) ? response : (response?.data || response?.members || []);
    return members.map((m: any) => ({
      _uid: m._uid || m.id || m.user_uid,
      name: m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
      email: m.email || '',
      avatar_url: m.avatar_url || m.profile_picture,
      role: m.role,
    }));
  }

  // ==================== MESSAGE METHODS ====================

  async getContactMessages(contactUid: string, params?: { page?: number; limit?: number }): Promise<ChatMessagesResponse> {
    const response = await externalWhatsappService.getContactMessages(contactUid, params);

    let messages: any[] = [];
    let total = 0;
    let contact: any = null;

    if (Array.isArray(response)) {
      messages = response;
      total = response.length;
    } else if (response?.data) {
      messages = Array.isArray(response.data) ? response.data : [];
      total = response.total || messages.length;
      contact = response.contact;
    } else if (response?.messages) {
      messages = response.messages;
      total = response.total || messages.length;
      contact = response.contact;
    }

    return {
      messages: messages.map((m: any) => this.normalizeMessage(m)),
      total,
      page: params?.page || 1,
      limit: params?.limit || 50,
      contact: contact ? this.normalizeContact(contact) : { _uid: contactUid, phone_number: '', unread_count: 0 },
    };
  }

  async sendMessage(contactUid: string, text: string): Promise<SendMessageResponse> {
    const response = await externalWhatsappService.sendChatMessage(contactUid, { message_body: text });
    return {
      message_uid: response?.message_uid || response?._uid || response?.id,
      status: response?.status || 'sent',
    };
  }

  async sendMediaMessage(
    contactUid: string,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    mediaUrl: string,
    caption?: string,
    fileName?: string
  ): Promise<SendMessageResponse> {
    const response = await externalWhatsappService.sendChatMediaMessage(contactUid, {
      media_type: mediaType,
      media_url: mediaUrl,
      caption,
      file_name: fileName,
    });
    return {
      message_uid: response?.message_uid || response?._uid || response?.id,
      status: response?.status || 'sent',
    };
  }

  async sendTemplateMessage(
    contactUid: string,
    templateName: string,
    templateLanguage: string,
    components?: any[]
  ): Promise<SendMessageResponse> {
    const response = await externalWhatsappService.sendChatTemplateMessage(contactUid, {
      template_name: templateName,
      template_language: templateLanguage,
      components,
    });
    return {
      message_uid: response?.message_uid || response?._uid || response?.id,
      status: response?.status || 'sent',
    };
  }

  async markAsRead(contactUid: string): Promise<void> {
    await externalWhatsappService.markMessagesAsRead(contactUid);
  }

  async clearChatHistory(contactUid: string): Promise<void> {
    await externalWhatsappService.clearChatHistory(contactUid);
  }

  // ==================== CONTACT MANAGEMENT ====================

  async assignUser(contactUid: string, userUid: string): Promise<void> {
    await externalWhatsappService.assignUserToContact(contactUid, { user_uid: userUid });
  }

  async assignLabels(contactUid: string, labelUids: string[]): Promise<void> {
    await externalWhatsappService.assignLabelsToContact(contactUid, { label_uids: labelUids });
  }

  async updateNotes(contactUid: string, notes: string): Promise<void> {
    await externalWhatsappService.updateContactNotes(contactUid, { notes });
  }

  // ==================== MESSAGE LOG ====================

  async getMessageLog(params?: {
    page?: number;
    limit?: number;
    contact_uid?: string;
    direction?: string;
  }): Promise<{ messages: ChatMessage[]; total: number }> {
    const response = await externalWhatsappService.getMessageLog(params);

    let messages: any[] = [];
    let total = 0;

    if (Array.isArray(response)) {
      messages = response;
      total = response.length;
    } else if (response?.data) {
      messages = Array.isArray(response.data) ? response.data : [];
      total = response.total || messages.length;
    } else if (response?.messages) {
      messages = response.messages;
      total = response.total || messages.length;
    }

    return {
      messages: messages.map((m: any) => this.normalizeMessage(m)),
      total,
    };
  }

  async getMessage(messageUid: string): Promise<ChatMessage> {
    const response = await externalWhatsappService.getMessage(messageUid);
    return this.normalizeMessage(response);
  }
}

export const chatService = new ChatService();
