import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useWebSocket } from '@/context/WebSocketProvider';
import { MessageCircle } from 'lucide-react';
import {
  useChatContacts,
  useUnreadCount,
  useChatMessages,
  useMarkAsRead,
  chatKeys,
} from '@/hooks/whatsapp/useChat';
import type { ChatContact } from '@/services/whatsapp/chatService';

export default function Chats() {
  const [selectedContactUid, setSelectedContactUid] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  const { payloads } = useWebSocket();
  const queryClient = useQueryClient();

  // React Query hooks
  const {
    contacts,
    total: contactsTotal,
    isLoading,
    isError,
    error,
    refetch: refetchContacts,
  } = useChatContacts({
    search: searchQuery || undefined,
  });

  // Unread count with polling every 30 seconds
  const { total: unreadTotal, contacts: unreadByContact } = useUnreadCount({
    pollInterval: 30000,
  });

  // Messages for selected contact
  const {
    messages,
    contact: currentContact,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useChatMessages({
    contactUid: selectedContactUid || null,
    enabled: !!selectedContactUid,
  });

  // Mark as read mutation
  const markAsReadMutation = useMarkAsRead();

  const normalize = (p?: string) => (p ? String(p).replace(/^\+/, '') : '');

  const formatLastTimestamp = (ts?: string | null) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();

    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (isYesterday) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Auto-select first contact on desktop when contacts load
  useEffect(() => {
    if (contacts.length > 0 && !selectedContactUid && !isMobile) {
      const firstContact = contacts[0];
      setSelectedContactUid(firstContact._uid || firstContact.phone_number);
    }
  }, [contacts, selectedContactUid, isMobile]);

  const handleConversationSelect = useCallback(async (contactId: string) => {
    setSelectedContactUid(contactId);

    // Mark as read when selecting
    try {
      await markAsReadMutation.mutateAsync(contactId);
    } catch (e) {
      // Silent fail
    }
  }, [markAsReadMutation]);

  const handleBackToList = useCallback(() => {
    if (isMobile) {
      setSelectedContactUid('');
    }
  }, [isMobile]);

  // Live updates via persistent WhatsApp WebSocket
  useEffect(() => {
    if (payloads.length > 0) {
      const latestPayload = payloads[payloads.length - 1];
      const { phone, name, contact, message } = latestPayload;

      console.log('🔄 Processing WebSocket payload:', {
        phone,
        name,
        is_new: contact?.is_new,
        message_text: message?.text,
      });

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: chatKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });

      // If the message is for the currently selected contact, refetch messages
      const phoneKey = normalize(phone);
      const selectedKey = normalize(selectedContactUid);
      if (phoneKey && selectedKey && phoneKey === selectedKey) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(selectedContactUid, {}),
          exact: false,
        });
      }
    }
  }, [payloads, selectedContactUid, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-base font-medium mb-1">Loading Chats</div>
          <div className="text-sm text-muted-foreground">Fetching your conversations...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="text-lg font-semibold mb-2 text-destructive">Failed to Load Chats</div>
          <div className="text-sm text-muted-foreground mb-6">
            {(error as any)?.message || 'Unable to load conversations'}
          </div>
          <button
            onClick={() => refetchContacts()}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Transform contacts to match ConversationList format
  const transformedConversations = contacts.map((contact: ChatContact) => {
    const contactId = contact._uid || contact.phone_number;
    const unreadCount = unreadByContact[contactId] || contact.unread_count || 0;
    const formattedTime = formatLastTimestamp(contact.last_message_at);

    return {
      id: contactId,
      name: contact.name || contact.first_name || contact.phone_number,
      lastMessage: contact.last_message || '',
      time: formattedTime,
      lastTimestamp: contact.last_message_at,
      channel: 'whatsapp' as const,
      unread: unreadCount > 0,
      unreadCount,
      phone: contact.phone_number,
    };
  });

  // Find selected conversation for ChatWindow
  const selectedConversation = contacts.find(
    (c: ChatContact) => (c._uid || c.phone_number) === selectedContactUid
  );

  // Convert to format ChatWindow expects
  const chatWindowConversation = selectedConversation
    ? {
        phone: selectedConversation.phone_number,
        name: selectedConversation.name || selectedConversation.first_name || selectedConversation.phone_number,
        last_message: selectedConversation.last_message || '',
        last_timestamp: selectedConversation.last_message_at || '',
        message_count: 0,
        direction: 'incoming' as const,
      }
    : undefined;

  // Mobile view: show either conversation list or chat window
  if (isMobile) {
    if (selectedContactUid) {
      return (
        <div className="h-full w-full bg-background overflow-hidden">
          <ChatWindow
            conversationId={selectedConversation?.phone_number || selectedContactUid}
            selectedConversation={chatWindowConversation}
            isMobile={true}
            onBack={handleBackToList}
          />
        </div>
      );
    }

    return (
      <div className="h-full w-full bg-background overflow-hidden">
        <ConversationList
          conversations={transformedConversations}
          selectedId={selectedContactUid}
          onSelect={handleConversationSelect}
          isMobile={true}
        />
      </div>
    );
  }

  // Desktop view: split layout
  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 lg:w-96 h-full flex-shrink-0">
        <ConversationList
          conversations={transformedConversations}
          selectedId={selectedContactUid}
          onSelect={handleConversationSelect}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 h-full min-w-0">
        {selectedContactUid ? (
          <ChatWindow
            conversationId={selectedConversation?.phone_number || selectedContactUid}
            selectedConversation={chatWindowConversation}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted/10">
            <div className="text-center max-w-sm px-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-12 w-12 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Select a Conversation</h2>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
