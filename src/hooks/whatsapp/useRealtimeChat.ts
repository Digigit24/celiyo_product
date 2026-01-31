// src/hooks/whatsapp/useRealtimeChat.ts
// Hook for real-time WhatsApp chat updates using Pusher/Laravel Echo

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  subscribeToVendorChannel,
  disconnectEcho,
  getCurrentVendorUid,
  ContactMessageEvent,
  ContactUpdatedEvent,
  MessageStatusEvent,
} from '@/services/pusherService';
import { chatKeys } from '@/hooks/whatsapp/useChat';

export interface RealtimeMessage {
  _uid: string;
  message: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'template';
  is_incoming_message: boolean;
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  messaged_at: string;
  formatted_message_time: string;
  media_url?: string;
  media_type?: string;
  file_name?: string;
}

export interface UseRealtimeChatOptions {
  enabled?: boolean;
  selectedContactUid?: string | null;
  onNewMessage?: (message: RealtimeMessage, contactUid: string) => void;
  onMessageStatusUpdate?: (messageUid: string, status: string) => void;
  playNotificationSound?: boolean;
}

export interface UseRealtimeChatReturn {
  isConnected: boolean;
  lastMessage: RealtimeMessage | null;
  connectionError: string | null;
}

export function useRealtimeChat(options: UseRealtimeChatOptions = {}): UseRealtimeChatReturn {
  const {
    enabled = true,
    selectedContactUid = null,
    onNewMessage,
    onMessageStatusUpdate,
    playNotificationSound = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    if (typeof window !== 'undefined' && playNotificationSound) {
      // Create a simple notification sound using Web Audio API
      notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
    }
  }, [playNotificationSound]);

  // Play notification sound
  const playSound = useCallback(() => {
    if (notificationSoundRef.current && playNotificationSound) {
      notificationSoundRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [playNotificationSound]);

  // Transform Pusher event to our message format
  const transformMessage = useCallback((data: ContactMessageEvent): RealtimeMessage => {
    return {
      _uid: data.message.uid,
      message: data.message.body,
      message_type: data.message.message_type,
      is_incoming_message: data.message.is_incoming_message,
      direction: data.message.is_incoming_message ? 'incoming' : 'outgoing',
      status: data.message.status,
      messaged_at: data.message.messaged_at,
      formatted_message_time: data.message.formatted_message_time,
      media_url: data.message.media?.url,
      media_type: data.message.media?.mime_type,
      file_name: data.message.media?.file_name,
    };
  }, []);

  // Handle new message event
  const handleNewMessage = useCallback((data: ContactMessageEvent) => {
    console.log('useRealtimeChat: New message received', data);

    const contactUid = data.contact?.uid;
    const message = transformMessage(data);

    setLastMessage(message);

    // Play sound for incoming messages
    if (message.is_incoming_message) {
      playSound();
    }

    // Call custom handler
    onNewMessage?.(message, contactUid);

    // Invalidate React Query caches to refetch data
    queryClient.invalidateQueries({ queryKey: chatKeys.contacts() });
    queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });

    // If this message is for the currently selected contact, invalidate messages too
    if (selectedContactUid && contactUid === selectedContactUid) {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(selectedContactUid, {}),
        exact: false,
      });
    }
  }, [queryClient, selectedContactUid, onNewMessage, transformMessage, playSound]);

  // Handle contact updated event
  const handleContactUpdated = useCallback((data: ContactUpdatedEvent) => {
    console.log('useRealtimeChat: Contact updated', data);

    // Invalidate contacts and unread count
    queryClient.invalidateQueries({ queryKey: chatKeys.contacts() });
    queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });

    // Invalidate chat context if viewing this contact
    if (selectedContactUid && data.contact?.uid === selectedContactUid) {
      queryClient.invalidateQueries({ queryKey: chatKeys.chatContext(selectedContactUid) });
    }
  }, [queryClient, selectedContactUid]);

  // Handle message status event
  const handleMessageStatus = useCallback((data: MessageStatusEvent) => {
    console.log('useRealtimeChat: Message status updated', data);

    const messageUid = data.message?.uid;
    const status = data.message?.status;

    // Call custom handler
    onMessageStatusUpdate?.(messageUid, status);

    // Invalidate messages for selected contact to show updated status
    if (selectedContactUid) {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(selectedContactUid, {}),
        exact: false,
      });
    }
  }, [queryClient, selectedContactUid, onMessageStatusUpdate]);

  // Subscribe to real-time channel
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const vendorUid = getCurrentVendorUid();

    if (!vendorUid) {
      console.warn('useRealtimeChat: No vendor UID available');
      setConnectionError('WhatsApp vendor not configured');
      return;
    }

    console.log('useRealtimeChat: Subscribing to vendor channel', vendorUid);

    // Subscribe to the vendor channel
    const unsubscribe = subscribeToVendorChannel(vendorUid, {
      onNewMessage: handleNewMessage,
      onContactUpdated: handleContactUpdated,
      onMessageStatus: handleMessageStatus,
      onConnected: () => {
        console.log('useRealtimeChat: Connected to Pusher');
        setIsConnected(true);
        setConnectionError(null);
      },
      onDisconnected: () => {
        console.log('useRealtimeChat: Disconnected from Pusher');
        setIsConnected(false);
      },
      onError: (error) => {
        console.error('useRealtimeChat: Connection error', error);
        setIsConnected(false);
        setConnectionError(error?.message || 'Connection failed');
      },
    });

    unsubscribeRef.current = unsubscribe;

    // Cleanup on unmount
    return () => {
      console.log('useRealtimeChat: Cleaning up subscription');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, handleNewMessage, handleContactUpdated, handleMessageStatus]);

  // Disconnect when component unmounts completely
  useEffect(() => {
    return () => {
      // Only disconnect if this is the last component using Echo
      // In practice, you might want more sophisticated lifecycle management
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    connectionError,
  };
}

// Export a simpler hook for just connection status
export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const vendorUid = getCurrentVendorUid();
    if (!vendorUid) return;

    const unsubscribe = subscribeToVendorChannel(vendorUid, {
      onConnected: () => setIsConnected(true),
      onDisconnected: () => setIsConnected(false),
    });

    return unsubscribe;
  }, []);

  return isConnected;
}
