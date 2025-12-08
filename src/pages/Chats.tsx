// src/pages/Chats.tsx
import { useEffect, useState } from 'react';
import { messagesService } from '@/services/whatsapp/messagesService';
import type { Conversation } from '@/types/whatsappTypes';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useWhatsappSocket } from '@/hooks/whatsapp/useWhatsappSocket';

export default function Chats() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMobile = useIsMobile();

  const normalize = (p?: string) => (p ? String(p).replace(/^\+/, '') : '');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  // ✅ Call the hook at the top level (not inside useEffect)
  const { subscribe } = useWhatsappSocket();

  // Load conversations on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await messagesService.getConversations();
        if (!cancelled) {
          setConversations(data);
          // Auto-select first conversation if available
          if (data.length > 0) {
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
  }, []);

  const handleConversationSelect = (phone: string) => {
    setSelectedConversationId(phone);
    // Reset unread counter for this conversation
    setUnreadCounts(prev => {
      const copy = { ...prev };
      copy[normalize(phone)] = 0;
      return copy;
    });
  };

  const handleBackToList = () => {
    if (isMobile) {
      setSelectedConversationId('');
    }
  };

  // Live updates via persistent WhatsApp WebSocket
  useEffect(() => {
    // ✅ Now we just use the subscribe function returned from the hook
    const unsub = subscribe((payload: any) => {
      try {
        const evt = payload?.event as string;
        const data = payload?.data;
        if (!evt || !data) return;

        if (evt === 'message_incoming' || evt === 'message_outgoing') {
          const phoneKey = normalize(data.phone);
          const m = data.message || {};
          const last_message = m.text || m.message_text || '';
          const last_timestamp = m.timestamp || m.created_at || new Date().toISOString();
          const direction: 'incoming' | 'outgoing' = evt === 'message_outgoing' ? 'outgoing' : 'incoming';

          // Update conversations list (insert new or update existing and move to top)
          setConversations(prev => {
            const list = prev ? [...prev] : [];
            const idx = list.findIndex(c => normalize(c.phone) === phoneKey);
            if (idx === -1) {
              const name = data.contact_name || data.name || data.phone || phoneKey;
              list.unshift({
                phone: data.phone || phoneKey,
                name,
                last_message,
                last_timestamp,
                message_count: 1,
                direction,
              });
            } else {
              const existing = list[idx];
              const updated: Conversation = {
                ...existing,
                last_message,
                last_timestamp,
                message_count: (existing.message_count || 0) + 1,
                direction,
              };
              list.splice(idx, 1);
              list.unshift(updated);
            }
            return list;
          });

          // Update unread counts for incoming messages if not the currently open chat
          if (direction === 'incoming') {
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
      } catch (e) {
        console.error('Failed to handle socket event in Chats:', e);
      }
    });

    return () => {
      unsub?.();
    };
  }, [subscribe, selectedConversationId]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading WhatsApp Chats...</div>
            <div className="text-sm text-muted-foreground">Fetching conversations</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-lg font-semibold mb-2 text-destructive">Error Loading Chats</div>
            <div className="text-sm text-muted-foreground mb-4">{error.message}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Transform API conversations to match ConversationList format with unread counters
  const transformedConversations = (conversations || []).map(conv => {
    const key = normalize(conv.phone);
    const unreadCount = unreadCounts[key] || 0;
    return {
      id: conv.phone,
      name: conv.name || conv.phone,
      lastMessage: conv.last_message,
      time: new Date(conv.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'whatsapp' as const,
      unread: unreadCount > 0,
      unreadCount,
    };
  });

  // Mobile view: show either conversation list or chat window
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
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
      <div className="flex h-screen bg-background overflow-hidden">
        <div className="flex-1 h-full">
          <ConversationList
            conversations={transformedConversations}
            selectedId={selectedConversationId}
            onSelect={handleConversationSelect}
            isMobile={true}
          />
        </div>
      </div>
    );
  }

  // Desktop view: show all components
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="flex-shrink-0 h-full">
        <ConversationList
          conversations={transformedConversations}
          selectedId={selectedConversationId}
          onSelect={handleConversationSelect}
        />
      </div>
      {selectedConversationId ? (
        <div className="flex-1 h-full overflow-hidden">
          <ChatWindow
            conversationId={selectedConversationId}
            selectedConversation={conversations?.find(c => c.phone === selectedConversationId)}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Select a conversation</div>
            <div className="text-sm text-muted-foreground">Choose a conversation from the list to start chatting</div>
          </div>
        </div>
      )}
    </div>
  );
}