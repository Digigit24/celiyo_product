// src/services/pusherService.ts
// Real-time messaging service using Pusher/Laravel Echo

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_CONFIG } from '@/lib/apiConfig';
import { tokenManager } from '@/lib/client';

// Make Pusher available globally for Laravel Echo
declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any> | null;
  }
}

window.Pusher = Pusher;

// Pusher Configuration
const PUSHER_CONFIG = {
  key: '649db422ae8f2e9c7a9d',
  cluster: 'ap2',
  forceTLS: true,
};

// Get vendor UID from localStorage
const getVendorUid = (): string | null => {
  try {
    const userJson = localStorage.getItem('celiyo_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return user?.tenant?.whatsapp_vendor_uid || null;
    }
  } catch (error) {
    console.error('Failed to get WhatsApp Vendor UID:', error);
  }
  return null;
};

// Get access token
const getAccessToken = (): string | null => {
  try {
    const userJson = localStorage.getItem('celiyo_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return user?.tenant?.whatsapp_api_token || tokenManager.getAccessToken() || null;
    }
  } catch (error) {
    console.error('Failed to get access token:', error);
  }
  return tokenManager.getAccessToken();
};

// Event types from Laravel broadcasting
export interface ContactMessageEvent {
  contact: {
    uid: string;
    phone_number: string;
    full_name: string;
    name_initials: string;
    labels: any[];
    assigned_user: any;
  };
  message: {
    uid: string;
    body: string;
    message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'template';
    is_incoming_message: boolean;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    messaged_at: string;
    formatted_message_time: string;
    media?: {
      url: string;
      mime_type: string;
      file_name?: string;
    };
  };
}

export interface ContactUpdatedEvent {
  contact: {
    uid: string;
    phone_number: string;
    full_name: string;
    labels: any[];
    assigned_user: any;
    unread_messages_count: number;
  };
}

export interface MessageStatusEvent {
  message: {
    uid: string;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    updated_at: string;
  };
}

export interface RealtimeCallbacks {
  onNewMessage?: (data: ContactMessageEvent) => void;
  onContactUpdated?: (data: ContactUpdatedEvent) => void;
  onMessageStatus?: (data: MessageStatusEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

let echoInstance: Echo<any> | null = null;
let currentChannel: any = null;

// Initialize Laravel Echo with Pusher
export const initEcho = (): Echo<any> | null => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    console.warn('No access token available for Pusher authentication');
    return null;
  }

  // Return existing instance if already initialized
  if (echoInstance) {
    return echoInstance;
  }

  try {
    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: PUSHER_CONFIG.key,
      cluster: PUSHER_CONFIG.cluster,
      forceTLS: PUSHER_CONFIG.forceTLS,
      authEndpoint: `${API_CONFIG.WHATSAPP_EXTERNAL_BASE_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
      // Enable Pusher logging in development
      enabledTransports: ['ws', 'wss'],
    });

    window.Echo = echoInstance;

    console.log('Laravel Echo initialized with Pusher');
    return echoInstance;
  } catch (error) {
    console.error('Failed to initialize Laravel Echo:', error);
    return null;
  }
};

// Subscribe to vendor channel for real-time updates
export const subscribeToVendorChannel = (
  vendorUid: string,
  callbacks: RealtimeCallbacks
): (() => void) => {
  const echo = initEcho();

  if (!echo) {
    console.error('Echo not initialized - cannot subscribe to channel');
    return () => {};
  }

  const channelName = `vendor.${vendorUid}`;
  console.log(`Subscribing to private channel: ${channelName}`);

  try {
    currentChannel = echo.private(channelName)
      .listen('.contact.message', (data: ContactMessageEvent) => {
        console.log('Real-time: New message received', {
          contact: data.contact?.uid,
          messageType: data.message?.message_type,
          isIncoming: data.message?.is_incoming_message,
        });
        callbacks.onNewMessage?.(data);
      })
      .listen('.contact.updated', (data: ContactUpdatedEvent) => {
        console.log('Real-time: Contact updated', {
          contact: data.contact?.uid,
          unread: data.contact?.unread_messages_count,
        });
        callbacks.onContactUpdated?.(data);
      })
      .listen('.message.status', (data: MessageStatusEvent) => {
        console.log('Real-time: Message status changed', {
          message: data.message?.uid,
          status: data.message?.status,
        });
        callbacks.onMessageStatus?.(data);
      })
      .subscribed(() => {
        console.log(`Successfully subscribed to ${channelName}`);
        callbacks.onConnected?.();
      })
      .error((error: any) => {
        console.error(`Error subscribing to ${channelName}:`, error);
        callbacks.onError?.(error);
      });

    // Return cleanup function
    return () => {
      console.log(`Unsubscribing from ${channelName}`);
      echo.leave(channelName);
      currentChannel = null;
    };
  } catch (error) {
    console.error('Failed to subscribe to vendor channel:', error);
    callbacks.onError?.(error);
    return () => {};
  }
};

// Disconnect Echo instance
export const disconnectEcho = (): void => {
  if (echoInstance) {
    console.log('Disconnecting Laravel Echo');
    echoInstance.disconnect();
    echoInstance = null;
    window.Echo = null;
  }
};

// Check if Echo is connected
export const isEchoConnected = (): boolean => {
  return echoInstance !== null && echoInstance.connector?.pusher?.connection?.state === 'connected';
};

// Get current vendor UID
export const getCurrentVendorUid = getVendorUid;

// Reconnect Echo (useful after token refresh)
export const reconnectEcho = (): Echo<any> | null => {
  disconnectEcho();
  return initEcho();
};
