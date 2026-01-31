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
  // Enable logging in development
  enableLogging: import.meta.env.DEV,
};

// Get the Laravel app base URL (without /api suffix for broadcasting)
const getLaravelBaseUrl = (): string => {
  // Use the LARAVEL_APP_URL which doesn't have /api suffix
  const laravelUrl = API_CONFIG.LARAVEL_APP_URL || 'https://whatsappapi.celiyo.com';
  return laravelUrl;
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
    console.warn('Pusher: No access token available for authentication');
    return null;
  }

  // Return existing instance if already initialized
  if (echoInstance) {
    return echoInstance;
  }

  // Broadcasting auth endpoint - Laravel uses /broadcasting/auth (not under /api)
  const laravelBaseUrl = getLaravelBaseUrl();
  const authEndpoint = `${laravelBaseUrl}/broadcasting/auth`;

  console.log('Pusher: Initializing with config:', {
    key: PUSHER_CONFIG.key,
    cluster: PUSHER_CONFIG.cluster,
    authEndpoint,
    hasToken: !!accessToken,
  });

  try {
    // Enable Pusher debug logging in development
    if (PUSHER_CONFIG.enableLogging) {
      Pusher.logToConsole = true;
    }

    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: PUSHER_CONFIG.key,
      cluster: PUSHER_CONFIG.cluster,
      forceTLS: PUSHER_CONFIG.forceTLS,
      authEndpoint,
      auth: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
      // Enable both WebSocket transports
      enabledTransports: ['ws', 'wss'],
    });

    window.Echo = echoInstance;

    // Log connection state changes
    const pusher = echoInstance.connector?.pusher;
    if (pusher) {
      pusher.connection.bind('state_change', (states: { previous: string; current: string }) => {
        console.log(`Pusher: Connection state changed from ${states.previous} to ${states.current}`);
      });

      pusher.connection.bind('connected', () => {
        console.log('Pusher: Successfully connected, socket_id:', pusher.connection.socket_id);
      });

      pusher.connection.bind('error', (error: any) => {
        console.error('Pusher: Connection error:', error);
      });
    }

    console.log('Pusher: Laravel Echo initialized successfully');
    return echoInstance;
  } catch (error) {
    console.error('Pusher: Failed to initialize Laravel Echo:', error);
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
    console.error('Pusher: Echo not initialized - cannot subscribe to channel');
    callbacks.onError?.({ message: 'Echo not initialized' });
    return () => {};
  }

  const channelName = `vendor.${vendorUid}`;
  console.log(`Pusher: Subscribing to private channel: ${channelName}`);

  try {
    currentChannel = echo.private(channelName)
      .listen('.contact.message', (data: ContactMessageEvent) => {
        console.log('Pusher: New message received', {
          contact: data.contact?.uid,
          messageType: data.message?.message_type,
          isIncoming: data.message?.is_incoming_message,
          body: data.message?.body?.substring(0, 50),
        });
        callbacks.onNewMessage?.(data);
      })
      .listen('.contact.updated', (data: ContactUpdatedEvent) => {
        console.log('Pusher: Contact updated', {
          contact: data.contact?.uid,
          unread: data.contact?.unread_messages_count,
        });
        callbacks.onContactUpdated?.(data);
      })
      .listen('.message.status', (data: MessageStatusEvent) => {
        console.log('Pusher: Message status changed', {
          message: data.message?.uid,
          status: data.message?.status,
        });
        callbacks.onMessageStatus?.(data);
      })
      .subscribed(() => {
        console.log(`Pusher: Successfully subscribed to ${channelName}`);
        callbacks.onConnected?.();
      })
      .error((error: any) => {
        console.error(`Pusher: Error subscribing to ${channelName}:`, error);
        // Provide more details about the error
        if (error?.status === 403) {
          console.error('Pusher: 403 Forbidden - Check broadcasting auth endpoint and token');
        } else if (error?.status === 401) {
          console.error('Pusher: 401 Unauthorized - Token may be invalid or expired');
        }
        callbacks.onError?.(error);
      });

    // Return cleanup function
    return () => {
      console.log(`Pusher: Unsubscribing from ${channelName}`);
      echo.leave(channelName);
      currentChannel = null;
    };
  } catch (error) {
    console.error('Pusher: Failed to subscribe to vendor channel:', error);
    callbacks.onError?.(error);
    return () => {};
  }
};

// Disconnect Echo instance
export const disconnectEcho = (): void => {
  if (echoInstance) {
    console.log('Pusher: Disconnecting Laravel Echo');
    echoInstance.disconnect();
    echoInstance = null;
    window.Echo = null;
  }
};

// Force reconnect with fresh token (useful after login/token refresh)
export const forceReconnect = (): Echo<any> | null => {
  console.log('Pusher: Force reconnecting...');
  disconnectEcho();
  return initEcho();
};

// Check if Echo is connected
export const isEchoConnected = (): boolean => {
  const state = echoInstance?.connector?.pusher?.connection?.state;
  return state === 'connected';
};

// Get connection state for debugging
export const getConnectionState = (): string => {
  return echoInstance?.connector?.pusher?.connection?.state || 'not_initialized';
};

// Get current vendor UID
export const getCurrentVendorUid = getVendorUid;

// Reconnect Echo (useful after token refresh)
export const reconnectEcho = (): Echo<any> | null => {
  console.log('Pusher: Reconnecting...');
  disconnectEcho();
  return initEcho();
};
