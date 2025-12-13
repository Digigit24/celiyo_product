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
  private normalizeTimestamp(ts?: string | null): string {
    if (!ts) {
      return new Date().toISOString();
    }
    const trimmed = String(ts).trim();
    const withT = trimmed.replace(' ', 'T');
    if (/[+-]\d{2}:?\d{2}$/.test(withT) || withT.endsWith('Z')) {
      return withT;
    }
    return `${withT}Z`;
  }

  /**
   * Send a text message
   */
  async sendTextMessage(payload: SendTextMessagePayload): Promise<SendTextMessageResponse> {
    try {
      const response = await whatsappClient.post<SendTextMessageResponse>(
        API_CONFIG.WHATSAPP.SEND_TEXT,
        payload
      );

      return response.data;
    } catch (error: any) {
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
      const response = await whatsappClient.post<SendMediaMessageResponse>(
        API_CONFIG.WHATSAPP.SEND_MEDIA,
        payload
      );

      return response.data;
    } catch (error: any) {
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
      const response = await whatsappClient.post<SendLocationMessageResponse>(
        API_CONFIG.WHATSAPP.SEND_LOCATION,
        payload
      );

      return response.data;
    } catch (error: any) {
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
          merged.set(key, {
            ...conv,
            last_timestamp: this.normalizeTimestamp(conv.last_timestamp),
          });
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
          last_timestamp: this.normalizeTimestamp(latest.last_timestamp),
          message_count,
          direction: latest.direction,
          window_is_open: latest.window_is_open ?? existing.window_is_open,
          window_expires_at: latest.window_expires_at ?? existing.window_expires_at,
          time_remaining_seconds: latest.time_remaining_seconds ?? existing.time_remaining_seconds,
          requires_template: latest.requires_template ?? existing.requires_template,
        };

        merged.set(key, mergedConv);
      }

      const deduped = Array.from(merged.values());

      return deduped;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to fetch conversations';
      throw new Error(message);
    }
  }

  /**
   * Get conversation messages by phone number
   */
  async getConversationMessages(phone: string): Promise<ConversationDetail> {
    try {
      // Always call API with digits-only path segment (avoid '+' in URL to bypass upstream/CORS issues)
      const cleanPhone = String(phone).trim().replace(/^\+/, '');
      const url = buildUrl(
        API_CONFIG.WHATSAPP.CONVERSATION_DETAIL,
        { phone: cleanPhone },
        'whatsapp'
      );

      const response = await whatsappClient.get(url);

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
        // Ensure ID is always a string
        const id = String(
          m.message_id ||
          m.id ||
          `local-${Math.random().toString(36).slice(2)}`
        );

        const text = m.text ?? m.message_text ?? '';

        const rawTimestamp =
          m.timestamp ||
          m.meta_data?.timestamp ||
          m.created_at ||
          m.updated_at;
        const timestamp = this.normalizeTimestamp(rawTimestamp);

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
          ['text', 'image', 'video', 'audio', 'document'].includes(m.message_type)
            ? m.message_type
            : 'text';

        // Status mapping from API response
        const status: 'sent' | 'delivered' | 'read' | 'failed' | undefined =
          m.status || m.delivery_status || (direction === 'outgoing' ? 'sent' : undefined);

        return {
          id,
          from: m.from ?? apiPhone,
          to: m.to ?? null,
          text,
          type,
          direction,
          timestamp,
          status,
          metadata: {
            ...(m.meta_data ?? m.metadata),
            created_at: m.created_at,
            updated_at: m.updated_at,
            timestamp: this.normalizeTimestamp(m.meta_data?.timestamp || m.timestamp || m.created_at),
            ws_received_at: Date.parse(m.created_at || m.timestamp || m.meta_data?.timestamp || '') || undefined,
          },
        } as const;
      });

      const conversationDetail: ConversationDetail = {
        phone,
        name: contactName,
        messages,
      };

      return conversationDetail;
    } catch (error: any) {
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
      // Always call API with digits-only path segment (avoid '+' in URL to bypass upstream/CORS issues)
      const cleanPhone = String(phone).trim().replace(/^\+/, '');
      const url = buildUrl(
        API_CONFIG.WHATSAPP.DELETE_CONVERSATION,
        { phone: cleanPhone },
        'whatsapp'
      );

      const response = await whatsappClient.delete<DeleteConversationResponse>(url);

      return response.data;
    } catch (error: any) {
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
      const queryString = buildQueryString(query as unknown as Record<string, string | number | boolean>);
      const url = `${API_CONFIG.WHATSAPP.MESSAGES}${queryString}`;

      const response = await whatsappClient.get<RecentMessagesResponse>(url);

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to fetch recent messages';
      throw new Error(message);
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStats(): Promise<MessageStats> {
    try {
      const response = await whatsappClient.get<MessageStats>(
        API_CONFIG.WHATSAPP.STATS
      );

      return response.data;
    } catch (error: any) {
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
