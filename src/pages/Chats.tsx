import { useEffect, useState } from 'react';
import { messagesService } from '@/services/whatsapp/messagesService';
import type { Conversation } from '@/types/whatsappTypes';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useWebSocket } from '@/context/WebSocketProvider';
import { MessageCircle } from 'lucide-react';

export default function Chats() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMobile = useIsMobile();
  const { payloads } = useWebSocket();

  const normalize = (p?: string) => (p ? String(p).replace(/^\+/, '') : '');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

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

  const formatTimeRemaining = (seconds?: number | null) => {
    if (!seconds || seconds <= 0) return null;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    return `${mins}m`;
  };

  // Load conversations on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await messagesService.getConversations();
        if (!cancelled) {
          setConversations(data);
          // Auto-select first conversation if available on desktop
          if (data.length > 0 && !isMobile) {
            setSelectedConversationId(data[0].phone);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(new Error(e.message || 'Failed to load conversations'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isMobile]);

  const handleConversationSelect = (phone: string) => {
    setSelectedConversationId(phone);
    // Reset unread counter for this conversation
    const phoneKey = normalize(phone);
    setUnreadCounts(prev => {
      const copy = { ...prev };
      copy[phoneKey] = 0;
      return copy;
    });

    // Also reset unread_count in the conversation object
    setConversations(prev => {
      if (!prev) return prev;
      return prev.map(conv => {
        if (normalize(conv.phone) === phoneKey) {
          return { ...conv, unread_count: 0 };
        }
        return conv;
      });
    });
  };

  const handleBackToList = () => {
    if (isMobile) {
      setSelectedConversationId('');
    }
  };

  // Live updates via persistent WhatsApp WebSocket
  useEffect(() => {
    if (payloads.length > 0) {
      const latestPayload = payloads[payloads.length - 1];
      const { phone, name, contact, message } = latestPayload;

      // Normalize phone number for comparison
      const phoneKey = normalize(phone);

        phone,
        name,
        is_new: contact?.is_new,
        exists: contact?.exists,
        message_text: message?.text
      });

      setConversations(prev => {
        const list = prev ? [...prev] : [];
        const idx = list.findIndex(c => normalize(c.phone) === phoneKey);

        // If contact exists (idx !== -1), always update it - don't create new
        if (idx !== -1) {
          const existing = list[idx];

          // Calculate unread count: increment if incoming and not on selected conversation
          const isIncomingMessage = message?.direction === 'incoming';
          const isSelectedConversation = normalize(selectedConversationId) === phoneKey;
          const currentUnreadCount = existing.unread_count || 0;
          const newUnreadCount = isIncomingMessage && !isSelectedConversation
            ? currentUnreadCount + 1
            : currentUnreadCount;

            phoneKey,
            isIncomingMessage,
            isSelectedConversation,
            selectedConversationId: normalize(selectedConversationId),
            currentUnreadCount,
            newUnreadCount
          });

          const updated: Conversation = {
            ...existing,
            name: name || existing.name, // Use contact name from payload
            last_message: message?.text || '',
            last_timestamp: message?.timestamp || new Date().toISOString(),
            message_count: (existing.message_count || 0) + 1,
            unread_count: newUnreadCount,
            direction: message?.direction || 'incoming',
          };
          // Move to top of list
          list.splice(idx, 1);
          list.unshift(updated);
        } else {
          // Only create new if contact doesn't exist AND is marked as new
          if (contact?.is_new !== false) {
            const isIncomingMessage = message?.direction === 'incoming';
            list.unshift({
              phone: phone,
              name: name || phone,
              last_message: message?.text || '',
              last_timestamp: message?.timestamp || new Date().toISOString(),
              message_count: 1,
              unread_count: isIncomingMessage ? 1 : 0,
              direction: message?.direction || 'incoming',
            });
          } else {
          }
        }
        return list;
      });

      // Update unread counts for incoming messages
      if (message?.direction === 'incoming') {
        setUnreadCounts(prev => {
          const next = { ...prev };
          if (normalize(selectedConversationId) === phoneKey) {
            next[phoneKey] = 0;
          } else {
            next[phoneKey] = (next[phoneKey] || 0) + 1;
          }
          return next;
        });
      }
    }
  }, [payloads, selectedConversationId]);

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="text-lg font-semibold mb-2 text-destructive">Failed to Load Chats</div>
          <div className="text-sm text-muted-foreground mb-6">{error.message}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Transform API conversations to match ConversationList format with unread counters
  const transformedConversations = (conversations || []).map(conv => {
    const key = normalize(conv.phone);
    const unreadCount = unreadCounts[key] || conv.unread_count || 0;
    const formattedTime = formatLastTimestamp(conv.last_timestamp);
    const formattedRemaining = formatTimeRemaining(conv.time_remaining_seconds);
    return {
      id: conv.phone,
      name: conv.name || conv.phone,
      lastMessage: conv.last_message,
      time: formattedTime,
      lastTimestamp: conv.last_timestamp,
      channel: 'whatsapp' as const,
      unread: unreadCount > 0,
      unreadCount,
      windowIsOpen: conv.window_is_open,
      windowExpiresAt: conv.window_expires_at,
      timeRemainingLabel: formattedRemaining,
      requiresTemplate: conv.requires_template,
    };
  });

  // Mobile view: show either conversation list or chat window
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <div className="h-full w-full bg-background overflow-hidden">
          <ChatWindow
            conversationId={selectedConversationId}
            selectedConversation={conversations?.find(c => c.phone === selectedConversationId)}
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
          selectedId={selectedConversationId}
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
          selectedId={selectedConversationId}
          onSelect={handleConversationSelect}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 h-full min-w-0">
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            selectedConversation={conversations?.find(c => c.phone === selectedConversationId)}
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
