// src/context/RealtimeChatProvider.tsx
// Global provider for real-time chat updates via Pusher
// This runs at app level so unread counts update even when not on Chats page

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  subscribeToVendorChannel,
  getCurrentVendorUid,
  getConnectionState,
  VendorChannelBroadcastEvent,
} from '@/services/pusherService';
import { chatKeys } from '@/hooks/whatsapp/useChat';
import type { ChatContactsResponse } from '@/services/whatsapp/chatService';

interface RealtimeChatContextType {
  isConnected: boolean;
  connectionState: string;
  connectionError: string | null;
}

const RealtimeChatContext = createContext<RealtimeChatContextType>({
  isConnected: false,
  connectionState: 'not_initialized',
  connectionError: null,
});

export const useRealtimeChatStatus = () => useContext(RealtimeChatContext);

interface RealtimeChatProviderProps {
  children: React.ReactNode;
}

export const RealtimeChatProvider: React.FC<RealtimeChatProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Handle VendorChannelBroadcast event - update unread counts globally
  const handleVendorBroadcast = useCallback((data: VendorChannelBroadcastEvent) => {
    console.log('🔔 RealtimeChatProvider: VendorChannelBroadcast received', data);

    const { contactUid, isNewIncomingMessage } = data;

    if (isNewIncomingMessage && contactUid) {
      console.log('🔔 New incoming message - updating unread counts globally');

      // Update contacts cache - increment unread count for this contact
      queryClient.setQueriesData<ChatContactsResponse>(
        { queryKey: chatKeys.contacts() },
        (oldData) => {
          if (!oldData) return oldData;

          const updatedContacts = oldData.contacts.map((contact) => {
            if (contact._uid === contactUid) {
              return {
                ...contact,
                unread_count: (contact.unread_count || 0) + 1,
              };
            }
            return contact;
          });

          return {
            ...oldData,
            contacts: updatedContacts,
          };
        }
      );

      // Update global unread count cache
      queryClient.setQueryData<{ total: number; contacts: Record<string, number> }>(
        chatKeys.unreadCount(),
        (oldData) => {
          if (!oldData) return { total: 1, contacts: { [contactUid]: 1 } };

          const newContacts = { ...oldData.contacts };
          newContacts[contactUid] = (newContacts[contactUid] || 0) + 1;

          return {
            total: oldData.total + 1,
            contacts: newContacts,
          };
        }
      );

      // Invalidate to ensure fresh data is fetched when user visits Chats page
      queryClient.invalidateQueries({
        queryKey: chatKeys.contacts(),
        exact: false,
      });
    }
  }, [queryClient]);

  // Subscribe to Pusher channel at app level
  useEffect(() => {
    const vendorUid = getCurrentVendorUid();

    if (!vendorUid) {
      console.log('🔔 RealtimeChatProvider: No vendor UID - skipping subscription');
      return;
    }

    console.log('🔔 RealtimeChatProvider: Subscribing to vendor channel', vendorUid);

    const unsubscribe = subscribeToVendorChannel(vendorUid, {
      onVendorBroadcast: handleVendorBroadcast,
      onConnected: () => {
        console.log('🔔 RealtimeChatProvider: Connected to Pusher');
        setIsConnected(true);
        setConnectionError(null);
      },
      onDisconnected: () => {
        console.log('🔔 RealtimeChatProvider: Disconnected from Pusher');
        setIsConnected(false);
      },
      onError: (error) => {
        console.error('🔔 RealtimeChatProvider: Connection error', error);
        setIsConnected(false);
        setConnectionError(error?.message || 'Connection failed');
      },
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      console.log('🔔 RealtimeChatProvider: Cleaning up subscription');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [handleVendorBroadcast]);

  const value: RealtimeChatContextType = {
    isConnected,
    connectionState: getConnectionState(),
    connectionError,
  };

  return (
    <RealtimeChatContext.Provider value={value}>
      {children}
    </RealtimeChatContext.Provider>
  );
};
