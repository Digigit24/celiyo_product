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

  // Handle VendorChannelBroadcast event - refetch queries to refresh data immediately
  const handleVendorBroadcast = useCallback((data: VendorChannelBroadcastEvent) => {
    console.log('🔔 RealtimeChatProvider: VendorChannelBroadcast received', data);

    const { contactUid, isNewIncomingMessage } = data;

    if (isNewIncomingMessage && contactUid) {
      console.log('🔔 New incoming message - refetching contacts for fresh unread counts');

      // Force refetch contacts to get fresh unread counts from API
      queryClient.refetchQueries({
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
