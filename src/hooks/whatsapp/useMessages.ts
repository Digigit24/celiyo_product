import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { messagesService } from '@/services/whatsapp/messagesService';
import { uploadMedia } from '@/services/whatsapp';
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
            // Merge: purely additive - never lose messages
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const existingContentKeys = new Set(prev.map(m =>
                `${m.text?.trim()}_${m.direction}_${m.timestamp?.slice(0, 16)}`
              ));

              // Find NEW messages from cache that don't exist locally
              const newMessages = transformed.filter((m: WhatsAppMessage) => {
                // Skip if ID already exists
                if (existingIds.has(m.id)) return false;
                // Skip if same content+direction+time exists (handles temp→real transition)
                const contentKey = `${m.text?.trim()}_${m.direction}_${m.timestamp?.slice(0, 16)}`;
                if (existingContentKeys.has(contentKey)) return false;
                return true;
              });

              // Keep all prev messages, just update temp→real if matched
              const updatedPrev = prev.map(m => {
                // If this is a temp message, check if real version exists in transformed
                if (String(m.id).startsWith('temp_')) {
                  const realMessage = transformed.find((t: WhatsAppMessage) =>
                    t.text?.trim() === m.text?.trim() &&
                    t.direction === m.direction
                  );
                  if (realMessage) {
                    // Replace temp with real message (keeps real ID and metadata)
                    return realMessage;
                  }
                }
                return m;
              });

              // Remove duplicate IDs after temp→real replacement
              const seenIds = new Set<string>();
              const deduped = updatedPrev.filter(m => {
                if (seenIds.has(m.id)) return false;
                seenIds.add(m.id);
                return true;
              });

              // Combine and sort
              return [...deduped, ...newMessages].sort((a, b) =>
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
      await messagesService.sendTextMessage({
        to: conversationPhone,
        text: messageText
      });

      // Mark as delivered - real-time (Pusher) will sync the actual message
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, status: 'delivered' }
          : m
      ));

      // Only update contacts list for sidebar (last message preview)
      if (contactUid) {
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
    if (!contactUid) {
      setError('Contact not found');
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const file_preview_url = URL.createObjectURL(file);

    const optimisticMessage: WhatsAppMessage = {
      id: tempId,
      from: '',
      to: conversationPhone || '',
      text: caption || '',
      type: media_type,
      direction: 'outgoing',
      timestamp: new Date().toISOString(),
      status: 'sent',
      metadata: {
        file_preview_url,
        is_uploading: true,
        file_name: file.name,
      },
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Upload file to get public URL
      const uploadResponse = await uploadMedia(file);
      const media_url = uploadResponse.media_id || uploadResponse.url;

      // Update optimistic message with media URL
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, metadata: { ...m.metadata, media_url } }
          : m
      ));

      // Send via chatService with contactUid
      await chatService.sendMediaMessage(
        contactUid,
        media_type,
        media_url,
        caption,
        file.name
      );

      // Mark as delivered - real-time (Pusher) will sync the actual message
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, status: 'delivered', metadata: { ...m.metadata, is_uploading: false } }
          : m
      ));

      // Update contacts list for sidebar
      queryClient.invalidateQueries({ queryKey: chatKeys.contacts() });
    } catch (err: any) {
      console.error('❌ Failed to send media message:', err);
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, status: 'failed', metadata: { ...m.metadata, is_uploading: false, error: err.message } }
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
