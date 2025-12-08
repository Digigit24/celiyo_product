import { useState, useEffect, useCallback } from 'react';
import { messagesService } from '@/services/whatsapp/messagesService';
import { uploadMedia, sendMediaMessage as sendMedia } from '@/services/whatsapp';
import type { WhatsAppMessage } from '@/types/whatsappTypes';
import { useWebSocket } from '@/context/WebSocketProvider';

export interface UseMessagesReturn {
  messages: WhatsAppMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  sendMediaMessage: (file: File, media_type: "image" | "video" | "audio" | "document", caption?: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useMessages(conversationPhone: string | null): UseMessagesReturn {
  const { messages: allMessages } = useWebSocket();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!conversationPhone || allMessages.length === 0) {
      return;
    }

    const normalizedConvPhone = normalizePhone(conversationPhone);

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];

      const isForCurrentConversation = (msg: WhatsAppMessage) => {
        const normalizedMsgFrom = normalizePhone(msg.from);
        const normalizedMsgTo = normalizePhone(msg.to);
        const metaPhone = normalizePhone((msg.metadata as any)?.phone || (msg as any).phone);

        return (
          normalizedMsgFrom === normalizedConvPhone ||
          normalizedMsgTo === normalizedConvPhone ||
          metaPhone === normalizedConvPhone
        );
      };

      const hydrateMessage = (msg: WhatsAppMessage): WhatsAppMessage => {
        const normalizedMsgFrom = normalizePhone(msg.from);
        const normalizedMsgTo = normalizePhone(msg.to);
        const fallbackPhone =
          msg.from ||
          msg.to ||
          (msg.metadata as any)?.phone ||
          conversationPhone;

        const direction =
          msg.direction ||
          (normalizedMsgFrom === normalizedConvPhone
            ? 'incoming'
            : normalizedMsgTo === normalizedConvPhone
              ? 'outgoing'
              : 'incoming');

        const normalizedTs = normalizeTimestamp(
          msg.timestamp || (msg.metadata as any)?.timestamp
        );

        return {
          ...msg,
          direction,
          from: msg.from || (direction === 'incoming' ? fallbackPhone : msg.from || ''),
          to: msg.to || (direction === 'outgoing' ? fallbackPhone : msg.to || null),
          timestamp: normalizedTs,
          metadata: {
            ...(msg.metadata || {}),
            timestamp: (msg.metadata as any)?.timestamp || normalizedTs,
          },
        };
      };

      allMessages.forEach((messageFromSocket) => {
        if (!isForCurrentConversation(messageFromSocket)) {
          return;
        }

        const hydratedMessage = hydrateMessage(messageFromSocket);

        // Replace optimistic media message when server confirms upload
        if (hydratedMessage.metadata?.media_id) {
          const optimisticMessageIndex = updatedMessages.findIndex(
            (m) => m.metadata?.media_id === hydratedMessage.metadata?.media_id && m.metadata?.is_uploading
          );

          if (optimisticMessageIndex > -1) {
            updatedMessages[optimisticMessageIndex] = {
              ...updatedMessages[optimisticMessageIndex],
              ...hydratedMessage,
              metadata: {
                ...(updatedMessages[optimisticMessageIndex].metadata || {}),
                ...(hydratedMessage.metadata || {}),
                is_uploading: false,
              },
            };
            return;
          }
        }

        // Update existing message (including status updates)
        const existingMessageIndex = updatedMessages.findIndex(
          (m) => String(m.id) === String(hydratedMessage.id)
        );
        if (existingMessageIndex > -1) {
          updatedMessages[existingMessageIndex] = {
            ...updatedMessages[existingMessageIndex],
            ...hydratedMessage,
            metadata: hydratedMessage.metadata || updatedMessages[existingMessageIndex].metadata,
          };
          return;
        }

        // Otherwise push new message
        updatedMessages.push(hydratedMessage);
      });

      // Sort by timestamp to ensure correct order (especially for rapid messages)
      updatedMessages.sort((a, b) => {
        const timeA = Date.parse(normalizeTimestamp(a.timestamp || (a.metadata as any)?.timestamp)) || 0;
        const timeB = Date.parse(normalizeTimestamp(b.timestamp || (b.metadata as any)?.timestamp)) || 0;

        if (timeA !== timeB) {
          return timeA - timeB;
        }

        const wsOrderA = (a.metadata as any)?.ws_received_at || 0;
        const wsOrderB = (b.metadata as any)?.ws_received_at || 0;

        if (wsOrderA !== wsOrderB) {
          return wsOrderA - wsOrderB;
        }

        return String(a.id).localeCompare(String(b.id));
      });

      return updatedMessages;
    });
  }, [allMessages, conversationPhone]);

  const loadMessages = useCallback(async () => {
    if (!conversationPhone) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const conversationDetail = await messagesService.getConversationMessages(conversationPhone);

      // Normalize and sort messages by timestamp (oldest first) to ensure chronological order
      const sortedMessages = [...conversationDetail.messages]
        .map((m) => ({
          ...m,
          timestamp: normalizeTimestamp(m.timestamp || (m.metadata as any)?.timestamp),
          metadata: {
            ...(m.metadata || {}),
            timestamp: (m.metadata as any)?.timestamp || m.timestamp,
          },
        }))
        .sort((a, b) => {
          const timeA = Date.parse(a.timestamp) || 0;
          const timeB = Date.parse(b.timestamp) || 0;
          return timeA - timeB;
        });

      console.log('📥 Loaded messages:', {
        count: sortedMessages.length,
        withStatus: sortedMessages.filter(m => m.status).length,
        statuses: sortedMessages.map(m => ({
          id: String(m.id).substring(0, 10),
          status: m.status,
          direction: m.direction
        }))
      });

      setMessages(sortedMessages);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationPhone]);

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
  }, [conversationPhone]);

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

      // The websocket will handle replacing the temporary message
      // with the final one from the server.
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
  }, [conversationPhone]);

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
