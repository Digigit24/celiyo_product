// src/services/whatsapp/messagesService.ts
import { whatsappClient } from '@/lib/whatsappClient';
import { API_CONFIG, buildUrl, buildQueryString } from '@/lib/apiConfig';
import {
  SendTextMessagePayload,
  SendTextMessageResponse,
  SendMediaMessagePayload,
  SendMediaMessageResponse,
  SendLocationMessagePayload,
  SendLocationMessageResponse,
  Conversation,
  ConversationDetail,
  RecentMessagesQuery,
  RecentMessagesResponse,
  MessageStats,
  DeleteConversationResponse,
} from '@/types/whatsappTypes';

class MessagesService {
  /**
   * Send a text message
   */
  async sendTextMessage(payload: SendTextMessagePayload): Promise<SendTextMessageResponse> {
    try {
      console.log('📤 Sending text message to:', payload.to);

      const response = await whatsappClient.post<SendTextMessageResponse>(
        API_CONFIG.WHATSAPP.SEND_TEXT,
        payload
      );

      console.log('✅ Message sent:', {
        message_id: response.data.message_id,
        status: response.data.status
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);

      if (error.response?.status === 403) {
        throw new Error('WhatsApp module not enabled');
      }

      const message = error.response?.data?.detail || 'Failed to send message';
      throw new Error(message);
    }
  }

  /**
   * Send a media message (image, video, audio, document)
   */
  async sendMediaMessage(payload: SendMediaMessagePayload): Promise<SendMediaMessageResponse> {
    try {
      console.log('📤 Sending media message to:', payload.to, 'type:', payload.media_type);

      const response = await whatsappClient.post<SendMediaMessageResponse>(
        API_CONFIG.WHATSAPP.SEND_MEDIA,
        payload
      );

      console.log('✅ Media message sent:', {
        message_id: response.data.message_id,
        status: response.data.status,
        media_type: response.data.media_type
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send media message:', error);

      if (error.response?.status === 403) {
        throw new Error('WhatsApp module not enabled');
      }

      const message = error.response?.data?.detail || 'Failed to send media message';
      throw new Error(message);
    }
  }

  /**
   * Send a location message
   */
  async sendLocationMessage(payload: SendLocationMessagePayload): Promise<SendLocationMessageResponse> {
    try {
      console.log('📤 Sending location message to:', payload.to);

      const response = await whatsappClient.post<SendLocationMessageResponse>(
        API_CONFIG.WHATSAPP.SEND_LOCATION,
        payload
      );

      console.log('✅ Location message sent:', {
        message_id: response.data.message_id,
        status: response.data.status,
        coordinates: `${response.data.latitude}, ${response.data.longitude}`
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send location message:', error);

      if (error.response?.status === 403) {
        throw new Error('WhatsApp module not enabled');
      }

      const message = error.response?.data?.detail || 'Failed to send location message';
      throw new Error(message);
    }
  }

  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      console.log('📋 Fetching conversations');
      
      const response = await whatsappClient.get<Conversation[]>(
        API_CONFIG.WHATSAPP.CONVERSATIONS
      );

      const raw = response.data || [];
      
      // Deduplicate by phone number ignoring leading '+'
      const merged = new Map<string, Conversation>();
      for (const conv of raw) {
        const key = String(conv.phone || '').replace(/^\+/, '');
        const existing = merged.get(key);

        if (!existing) {
          merged.set(key, conv);
          continue;
        }

        // Pick the conversation with the latest timestamp for preview fields
        const existingTs = new Date(existing.last_timestamp || 0).getTime();
        const convTs = new Date(conv.last_timestamp || 0).getTime();
        const latest = convTs >= existingTs ? conv : existing;

        // Prefer display phone with '+' if available
        const phone =
          (conv.phone?.startsWith('+') ? conv.phone : undefined) ??
          (existing.phone?.startsWith('+') ? existing.phone : undefined) ??
          conv.phone ??
          existing.phone;

        // Prefer non-empty name
        const name = conv.name || existing.name || phone;

        // Sum message counts if both exist
        const message_count = (existing.message_count || 0) + (conv.message_count || 0);

        const mergedConv: Conversation = {
          phone,
          name,
          last_message: latest.last_message,
          last_timestamp: latest.last_timestamp,
          message_count,
          direction: latest.direction,
        };

        merged.set(key, mergedConv);
      }

      const deduped = Array.from(merged.values());
      console.log('✅ Conversations fetched:', raw.length, '→ deduped to:', deduped.length);
      
      return deduped;
    } catch (error: any) {
      console.error('❌ Failed to fetch conversations:', error);
      const message = error.response?.data?.detail || 'Failed to fetch conversations';
      throw new Error(message);
    }
  }

  /**
   * Get conversation messages by phone number
   */
  async getConversationMessages(phone: string): Promise<ConversationDetail> {
    try {
      console.log('📋 Fetching conversation messages for:', phone);

      // Always call API with digits-only path segment (avoid '+' in URL to bypass upstream/CORS issues)
      const cleanPhone = String(phone).trim().replace(/^\+/, '');
      const url = buildUrl(
        API_CONFIG.WHATSAPP.CONVERSATION_DETAIL,
        { phone: cleanPhone },
        'whatsapp'
      );

      const response = await whatsappClient.get(url);

      // Log the actual response structure to understand the API format
      console.log('🔍 Raw API response:', response.data);

      // Normalize API response to support both shapes:
      // 1) { phone, name?, contact_name?, messages: [...] }
      // 2) [ ...messages ]
      const data = response.data as any;
      const rawMessages: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.messages)
          ? data.messages
          : [];

      // Best-effort contact name resolution
      const contactName =
        (Array.isArray(data) ? undefined : (data?.name || data?.contact_name)) ??
        rawMessages[0]?.contact_name ??
        phone;

      // Transform API messages into WhatsAppMessage
      const messages = rawMessages.map((m: any) => {
        const id =
          m.message_id ||
          m.id ||
          `local-${Math.random().toString(36).slice(2)}`;

        const text = m.text ?? m.message_text ?? '';

        const timestamp =
          m.timestamp ||
          m.created_at ||
          new Date().toISOString();

        // Attempt to infer phone/from/to
        const apiPhone = m.phone ?? m.from ?? (Array.isArray(data) ? undefined : data?.phone) ?? phone;

        // Determine direction with multiple fallbacks
        let direction: 'incoming' | 'outgoing' = 'incoming';
        if (m.direction === 'incoming' || m.direction === 'outgoing') {
          direction = m.direction;
        } else if (typeof m.is_outgoing === 'boolean') {
          direction = m.is_outgoing ? 'outgoing' : 'incoming';
        } else if (m.from) {
          direction = (m.from === phone || m.from === (Array.isArray(data) ? undefined : data?.phone)) ? 'incoming' : 'outgoing';
        } else if (m.phone) {
          direction = (m.phone === phone) ? 'incoming' : 'outgoing';
        }

        // Type fallback
        const type: 'text' | 'image' | 'video' | 'audio' | 'document' =
          ['text', 'image', 'video', 'audio', 'document'].includes(m.type)
            ? m.type
            : 'text';

        return {
          id,
          from: m.from ?? apiPhone,
          to: m.to ?? null,
          text,
          type,
          direction,
          timestamp,
          metadata: m.meta_data ?? m.metadata,
        } as const;
      });

      const conversationDetail: ConversationDetail = {
        phone,
        name: contactName,
        messages,
      };

      console.log('✅ Conversation messages processed:', {
        phone: conversationDetail.phone,
        name: conversationDetail.name,
        messageCount: conversationDetail.messages.length,
      });

      return conversationDetail;
    } catch (error: any) {
      console.error('❌ Failed to fetch conversation messages:', error);

      if (error.response?.status === 404) {
        throw new Error('Conversation not found');
      }

      const message =
        error.response?.data?.detail || 'Failed to fetch conversation messages';
      throw new Error(message);
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(phone: string): Promise<DeleteConversationResponse> {
    try {
      console.log('🗑️ Deleting conversation:', phone);
      
      // Always call API with digits-only path segment (avoid '+' in URL to bypass upstream/CORS issues)
      const cleanPhone = String(phone).trim().replace(/^\+/, '');
      const url = buildUrl(
        API_CONFIG.WHATSAPP.DELETE_CONVERSATION,
        { phone: cleanPhone },
        'whatsapp'
      );
      
      const response = await whatsappClient.delete<DeleteConversationResponse>(url);
      
      console.log('✅ Conversation deleted:', {
        phone: response.data.phone,
        deleted_count: response.data.deleted_count
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to delete conversation:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Conversation not found');
      }
      
      const message = error.response?.data?.detail || 'Failed to delete conversation';
      throw new Error(message);
    }
  }

  /**
   * Get recent messages with filters
   */
  async getRecentMessages(query?: RecentMessagesQuery): Promise<RecentMessagesResponse> {
    try {
      console.log('📋 Fetching recent messages:', query);
      
      const queryString = buildQueryString(query as unknown as Record<string, string | number | boolean>);
      const url = `${API_CONFIG.WHATSAPP.MESSAGES}${queryString}`;
      
      const response = await whatsappClient.get<RecentMessagesResponse>(url);
      
      console.log('✅ Recent messages fetched:', {
        total: response.data.total,
        count: response.data.messages.length
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch recent messages:', error);
      const message = error.response?.data?.detail || 'Failed to fetch recent messages';
      throw new Error(message);
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStats(): Promise<MessageStats> {
    try {
      console.log('📊 Fetching message statistics');
      
      const response = await whatsappClient.get<MessageStats>(
        API_CONFIG.WHATSAPP.STATS
      );
      
      console.log('✅ Message stats fetched:', {
        total_messages: response.data.total_messages,
        total_conversations: response.data.total_conversations
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch message stats:', error);
      const message = error.response?.data?.detail || 'Failed to fetch message stats';
      throw new Error(message);
    }
  }

  /**
   * Get incoming messages only
   */
  async getIncomingMessages(limit: number = 100, offset: number = 0): Promise<RecentMessagesResponse> {
    return this.getRecentMessages({
      direction: 'incoming',
      limit,
      offset,
    });
  }

  /**
   * Get outgoing messages only
   */
  async getOutgoingMessages(limit: number = 100, offset: number = 0): Promise<RecentMessagesResponse> {
    return this.getRecentMessages({
      direction: 'outgoing',
      limit,
      offset,
    });
  }

  /**
   * Get messages for a specific phone number
   */
  async getMessagesByPhone(phone: string, limit: number = 100): Promise<RecentMessagesResponse> {
    return this.getRecentMessages({
      phone,
      limit,
    });
  }
}

export const messagesService = new MessagesService();