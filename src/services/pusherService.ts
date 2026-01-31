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

// Initialize Laravel Echo with Pusher using custom authorizer
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

  // Broadcasting auth endpoint - using /api/broadcasting/auth
  const authUrl = `${API_CONFIG.WHATSAPP_EXTERNAL_BASE_URL}/broadcasting/auth`;

  console.log('Pusher: Initializing with config:', {
    key: PUSHER_CONFIG.key,
    cluster: PUSHER_CONFIG.cluster,
    authUrl,
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
      // Use custom authorizer for better control over auth requests
      authorizer: (channel: any, options: any) => {
        return {
          authorize: (socketId: string, callback: (error: any, data: any) => void) => {
            console.log('Pusher: Authorizing channel:', channel.name, 'socket_id:', socketId);

            // IMPORTANT: Token goes in the URL query string (not in header)
            const authUrlWithToken = `${authUrl}?auth_token=${encodeURIComponent(accessToken)}`;

            fetch(authUrlWithToken, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            })
              .then(response => {
                console.log('Pusher: Auth response status:', response.status);
                if (!response.ok) {
                  throw new Error(`Auth failed with status ${response.status}`);
                }
                return response.json();
              })
              .then(data => {
                console.log('Pusher: Auth response data:', data);
                if (data.auth) {
                  console.log('Pusher: Auth successful for channel:', channel.name);
                  callback(null, data);
                } else {
                  console.error('Pusher: Auth failed - no auth key in response:', data);
                  callback(new Error(data.error || data.message || 'Auth failed - no auth key'), null);
                }
              })
              .catch(error => {
                console.error('Pusher: Auth error for channel:', channel.name, error);
                callback(error, null);
              });
          },
        };
      },
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

  // Channel name format: vendor-channel.{vendorUid} (with hyphen, not dot)
  const channelName = `vendor-channel.${vendorUid}`;
  console.log(`Pusher: Subscribing to private channel: ${channelName}`);

  try {
    currentChannel = echo.private(channelName)
      // Listen to the main VendorChannelBroadcast event
      .listen('.VendorChannelBroadcast', (data: any) => {
        console.log('Pusher: VendorChannelBroadcast event received:', data);

        // Handle different event types based on data structure
        if (data.message && data.contact) {
          // New message event
          console.log('Pusher: New message received', {
            contact: data.contact?.uid,
            messageType: data.message?.message_type,
            isIncoming: data.message?.is_incoming_message,
            body: data.message?.body?.substring(0, 50),
          });
          callbacks.onNewMessage?.(data as ContactMessageEvent);
        } else if (data.contact && !data.message) {
          // Contact updated event
          console.log('Pusher: Contact updated', {
            contact: data.contact?.uid,
            unread: data.contact?.unread_messages_count,
          });
          callbacks.onContactUpdated?.(data as ContactUpdatedEvent);
        } else if (data.message && data.message.status) {
          // Message status update event
          console.log('Pusher: Message status changed', {
            message: data.message?.uid,
            status: data.message?.status,
          });
          callbacks.onMessageStatus?.(data as MessageStatusEvent);
        }
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
