import { useState, useEffect, useCallback } from 'react';
import { messagesService } from '@/services/whatsapp/messagesService';
import type { WhatsAppMessage, ConversationDetail } from '@/types/whatsappTypes';
import { useWhatsappSocket } from '@/hooks/whatsapp/useWhatsappSocket';

export interface UseMessagesReturn {
  messages: WhatsAppMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  isSending: boolean;
}

export function useMessages(conversationPhone: string | null): UseMessagesReturn {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const normalizePhone = (p?: string | null) => (p ? String(p).replace(/^\+/, '') : '');

  // ✅ Call the hook at the top level of the custom hook (not inside useEffect)
  const { subscribe } = useWhatsappSocket();

  // Subscribe to persistent WhatsApp socket and append messages for the selected conversation
  useEffect(() => {
    const phoneSelected = normalizePhone(conversationPhone || undefined);

    const unsubscribe = subscribe((payload: any) => {
      try {
        const evt = payload?.event as string;
        const data = payload?.data;
        if (!evt || !data) return;

        if (evt === 'message_incoming' || evt === 'message_outgoing') {
          const phoneFromEvt = normalizePhone(data.phone);
          if (phoneSelected && phoneFromEvt !== phoneSelected) return;

          const m = data.message || {};
          const id =
            m.id ||
            m.message_id ||
            `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          const msg: WhatsAppMessage = {
            id,
            from: evt === 'message_outgoing' ? 'me' : (data.phone as string),
            to: evt === 'message_outgoing' ? (data.phone as string) : null,
            text: m.text || m.message_text || '',
            type: (m.type as any) || 'text',
            direction:
              (m.direction as any) ||
              (evt === 'message_outgoing' ? 'outgoing' : 'incoming'),
            timestamp: m.timestamp || m.created_at || new Date().toISOString(),
            metadata: m.metadata || m.meta_data || undefined,
          };

          setMessages((prev) => {
            if (prev.some((x) => x.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      } catch (err) {
        console.error('❌ Failed to handle socket event:', err);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [conversationPhone, subscribe]);

  const loadMessages = useCallback(async () => {
    if (!conversationPhone) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const conversationDetail = await messagesService.getConversationMessages(conversationPhone);
      setMessages(conversationDetail.messages);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationPhone]);

  const sendMessage = useCallback(async (text: string) => {
    if (!conversationPhone || !text.trim() || isSending) return;

    const messageText = text.trim();
    const tempMessage: WhatsAppMessage = {
      id: `temp-${Date.now()}`,
      from: 'me',
      to: conversationPhone,
      text: messageText,
      type: 'text',
      direction: 'outgoing',
      timestamp: new Date().toISOString(),
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, tempMessage]);
    setIsSending(true);
    setError(null);

    try {
      const response = await messagesService.sendTextMessage({
        to: conversationPhone,
        text: messageText
      });

      // Replace temp message with actual response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? {
                ...tempMessage,
                id: response.message_id,
                timestamp: response.timestamp || new Date().toISOString(),
              }
            : msg
        )
      );

      console.log('✅ Message sent successfully:', response);
    } catch (err: any) {
      console.error('❌ Failed to send message:', err);
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [conversationPhone, isSending]);

  const refreshMessages = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  // Load messages when conversation changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refreshMessages,
    isSending,
  };
}