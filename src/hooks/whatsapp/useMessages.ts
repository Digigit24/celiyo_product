import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { messagesService } from '@/services/whatsapp/messagesService';
import { uploadMedia, sendMediaMessage as sendMedia } from '@/services/whatsapp';
import type { WhatsAppMessage } from '@/types/whatsappTypes';
import { chatService } from '@/services/whatsapp/chatService';
import { chatKeys } from '@/hooks/whatsapp/useChat';
import { useRealtimeChat } from '@/hooks/whatsapp/useRealtimeChat';

export interface UseMessagesReturn {
  messages: WhatsAppMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  sendMediaMessage: (file: File, media_type: "image" | "video" | "audio" | "document", caption?: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useMessages(conversationPhone: string | null): UseMessagesReturn {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactUid, setContactUid] = useState<string | null>(null);

  // Enable real-time updates via Pusher
  useRealtimeChat({
    enabled: true,
    selectedContactUid: contactUid,
  });

  const normalizePhone = (p?: string | null) => (p ? String(p).replace(/^\+/, '') : '');
  const normalizeTimestamp = (ts?: string | null) => {
    if (!ts) return new Date().toISOString();
    const trimmed = String(ts).trim();
    const withT = trimmed.replace(' ', 'T');
    if (/[+-]\d{2}:?\d{2}$/.test(withT) || withT.endsWith('Z')) {
      return withT;
    }
    return `${withT}Z`;
  };

  // Subscribe to React Query cache updates for messages
  useEffect(() => {
    if (!contactUid) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.queryKey[0] === 'chat' && event.query.queryKey[1] === 'messages') {
        const queryContactUid = event.query.queryKey[2];
        if (queryContactUid === contactUid) {
          const data = event.query.state.data as any;
          if (data?.messages) {
            console.log('📬 useMessages: Cache updated, syncing messages');
            const transformed = data.messages.map((m: any) => {
              // API uses is_incoming_message boolean, convert to direction
              const isIncoming = m.is_incoming_message ?? (m.direction === 'incoming');
              const direction = isIncoming ? 'incoming' : 'outgoing';
              return {
                id: m._uid,
                from: isIncoming ? conversationPhone : '',
                to: isIncoming ? '' : conversationPhone,
                text: m.message || m.message_body || m.text || '',
                type: m.message_type || 'text',
                direction,
                timestamp: normalizeTimestamp(m.messaged_at || m.created_at || m.timestamp),
                status: m.status,
                metadata: m.metadata || {},
                template_proforma: m.template_proforma,
                template_component_values: m.template_component_values,
                template_components: m.template_components,
                media_values: m.media_values,
                interaction_message_data: m.interaction_message_data,
                template_message: m.template_message,
                whatsapp_message_error: m.whatsapp_message_error,
              };
            });
            // Merge: keep optimistic/pending messages not yet in API response
            setMessages(prev => {
              const apiIds = new Set(transformed.map((m: WhatsAppMessage) => m.id));
              // Also create a set of message text+direction for matching
              const apiMessageKeys = new Set(transformed.map((m: WhatsAppMessage) =>
                `${m.text}_${m.direction}`
              ));

              // Keep messages that are either:
              // 1. Optimistic (temp_ prefix) and not in API
              // 2. Recently sent outgoing messages not yet in API (by ID or content match)
              const pendingMessages = prev.filter(m => {
                const isTemp = String(m.id).startsWith('temp_');
                const inApiById = apiIds.has(m.id);
                const messageKey = `${m.text}_${m.direction}`;
                const inApiByContent = apiMessageKeys.has(messageKey);

                // Keep if it's a temp message not in API
                if (isTemp && !inApiById) return true;

                // Keep if it's a recent outgoing message (last 30 seconds) not in API
                if (m.direction === 'outgoing' && !inApiById && !inApiByContent) {
                  const msgTime = new Date(m.timestamp).getTime();
                  const now = Date.now();
                  const isRecent = (now - msgTime) < 30000; // 30 seconds
                  return isRecent;
                }

                return false;
              });

              // Build map of timestamps to preserve for outgoing messages
              const existingTimestamps = new Map<string, string>();
              prev.forEach(m => {
                if (m.direction === 'outgoing') {
                  existingTimestamps.set(m.id, m.timestamp);
                  // Also map by content for matching
                  existingTimestamps.set(`${m.text}_outgoing`, m.timestamp);
                }
              });

              // Preserve timestamps for messages we already had
              const mergedTransformed = transformed.map(m => {
                const existingTimestamp = existingTimestamps.get(m.id) ||
                  (m.direction === 'outgoing' ? existingTimestamps.get(`${m.text}_outgoing`) : null);
                if (existingTimestamp && m.direction === 'outgoing') {
                  return { ...m, timestamp: existingTimestamp };
                }
                return m;
              });

              return [...mergedTransformed, ...pendingMessages].sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [contactUid, conversationPhone, queryClient]);

  const loadMessages = useCallback(async () => {
    if (!conversationPhone) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First get contact UID from phone
      const contacts = await chatService.getChatContacts({ search: conversationPhone, limit: 1 });
      const contact = contacts.contacts.find(c =>
        normalizePhone(c.phone_number) === normalizePhone(conversationPhone)
      );

      if (contact) {
        setContactUid(contact._uid);

        // Fetch messages using chat service (React Query backed)
        const result = await chatService.getContactMessages(contact._uid, { limit: 100 });

        // Update React Query cache
        queryClient.setQueryData(chatKeys.messages(contact._uid, {}), result);

        // Transform to WhatsAppMessage format
        const transformedMessages = result.messages.map((m: any) => {
          // API uses is_incoming_message boolean, convert to direction
          const isIncoming = m.is_incoming_message ?? (m.direction === 'incoming');
          const direction = isIncoming ? 'incoming' : 'outgoing';
          return {
            id: m._uid,
            from: isIncoming ? conversationPhone : '',
            to: isIncoming ? '' : conversationPhone,
            text: m.message || m.message_body || m.text || '',
            type: m.message_type || 'text',
            direction,
            timestamp: normalizeTimestamp(m.messaged_at || m.created_at || m.timestamp),
            status: m.status,
            metadata: m.metadata || {},
            template_proforma: m.template_proforma,
            template_component_values: m.template_component_values,
            template_components: m.template_components,
            media_values: m.media_values,
            interaction_message_data: m.interaction_message_data,
            template_message: m.template_message,
            whatsapp_message_error: m.whatsapp_message_error,
          };
        });

        console.log('📥 Loaded messages:', {
          count: transformedMessages.length,
          contactUid: contact._uid,
        });

        setMessages(transformedMessages);
      } else {
        // Fallback to legacy messages service
        const conversationDetail = await messagesService.getConversationMessages(conversationPhone);
        const sortedMessages = [...conversationDetail.messages]
          .map((m) => ({
            ...m,
            timestamp: normalizeTimestamp(m.timestamp || (m.metadata as any)?.timestamp),
          }))
          .sort((a, b) => {
            const timeA = Date.parse(a.timestamp) || 0;
            const timeB = Date.parse(b.timestamp) || 0;
            return timeA - timeB;
          });

        setMessages(sortedMessages);
      }
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationPhone, queryClient]);

  const sendMessage = useCallback(async (text: string) => {
    if (!conversationPhone || !text.trim()) return;

    const messageText = text.trim();

    // Create optimistic message with 'sent' status
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: WhatsAppMessage = {
      id: tempId,
      from: '',
      to: conversationPhone,
      text: messageText,
      type: 'text',
      direction: 'outgoing',
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await messagesService.sendTextMessage({
        to: conversationPhone,
        text: messageText
      });

      // Update the optimistic message with the real message ID
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, id: response.message_id, status: 'sent' }
          : m
      ));

      // Invalidate React Query cache to trigger refresh
      if (contactUid) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(contactUid, {}),
          exact: false,
        });
        queryClient.invalidateQueries({ queryKey: chatKeys.contacts() });
      }
    } catch (err: any) {
      console.error('❌ Failed to send message:', err);
      // Mark message as failed
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, status: 'failed', metadata: { ...m.metadata, error: err.message } }
          : m
      ));
      setError(err.message || 'Failed to send message');
      throw err;
    }
  }, [conversationPhone, contactUid, queryClient]);

  const sendMediaMessage = useCallback(async (file: File, media_type: "image" | "video" | "audio" | "document", caption?: string) => {
    if (!conversationPhone) return;

    const tempId = `temp_${Date.now()}`;
    const file_preview_url = URL.createObjectURL(file);

    const optimisticMessage: WhatsAppMessage = {
      id: tempId,
      from: '', // This will be set to 'me' in the UI
      to: conversationPhone,
      text: caption || '',
      type: media_type,
      direction: 'outgoing',
      timestamp: new Date().toISOString(),
      status: 'sent',
      metadata: {
        file_preview_url,
        is_uploading: true,
      },
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const uploadResponse = await uploadMedia(file);
      const media_id = uploadResponse.media_id;

      // Update the optimistic message with the media_id
      setMessages(prev => prev.map(m => 
        m.id === tempId 
          ? { ...m, metadata: { ...m.metadata, media_id: media_id } } 
          : m
      ));

      await sendMedia({
        to: conversationPhone,
        media_id,
        media_type,
        caption,
      });

      // Mark upload as complete
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, metadata: { ...m.metadata, is_uploading: false } }
          : m
      ));

      // Invalidate React Query cache to trigger refresh
      if (contactUid) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(contactUid, {}),
          exact: false,
        });
        queryClient.invalidateQueries({ queryKey: chatKeys.contacts() });
      }
    } catch (err: any) {
      console.error('❌ Failed to send media message:', err);
      // On failure, update optimistic message to show error
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, metadata: { ...m.metadata, is_uploading: false, error: 'Upload failed' } }
          : m
      ));
      setError(err.message || 'Failed to send media message');
      throw err;
    }
  }, [conversationPhone, contactUid, queryClient]);

  const refreshMessages = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendMediaMessage,
    refreshMessages,
  };
}
