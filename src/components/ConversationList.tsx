import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, MessageCircle, Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type ConversationItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  lastTimestamp?: string;
  channel: string;
  unread: boolean;
  unreadCount?: number;
  windowIsOpen?: boolean;
  windowExpiresAt?: string | null;
  timeRemainingLabel?: string | null;
  requiresTemplate?: boolean;
};

const channelIcon = (channel: string) => {
  switch (channel) {
    case "whatsapp":
      return <Phone size={16} className="text-green-500" />;
    case "instagram":
      return <MessageCircle size={16} className="text-pink-500" />;
    case "website":
      return <Home size={16} className="text-blue-500" />;
    default:
      return null;
  }
};

type Props = {
  conversations: ConversationItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  isMobile?: boolean;
};

export const ConversationList = ({ conversations, selectedId, onSelect, isMobile }: Props) => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  // Filter conversations by tab
  let filtered = conversations;
  if (tab === "mine") {
    filtered = filtered.filter((c) => parseInt(c.id) % 2 === 0);
  } else if (tab === "unassigned") {
    filtered = filtered.filter((c) => parseInt(c.id) % 2 !== 0);
  }
  if (search.trim()) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase())
    );
  }

  const formatDateLabel = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full w-full bg-card">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between h-14 border-b border-border px-4 bg-card">
        <h1 className="font-semibold text-base">Chats</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
          {conversations.length}
        </span>
      </div>

      {/* Search and Filters - Fixed */}
      <div className="flex-shrink-0 flex flex-col gap-3 p-3 bg-card border-b border-border">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 h-10 bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/50">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="mine" className="text-xs">
              Mine
            </TabsTrigger>
            <TabsTrigger value="unassigned" className="text-xs">
              Unassigned
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversations List - Scrollable with native overflow */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              No conversations found
            </p>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setSearch("")}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          filtered.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex items-start gap-3 px-4 py-3 border-b border-border transition-colors hover:bg-accent/50 text-left w-full",
                selectedId === conversation.id && "bg-accent"
              )}
            >
              {/* Avatar */}
              <div className="flex-none mt-1 relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {conversation.name.charAt(0).toUpperCase()}
                </div>
                {/* Unread indicator badge */}
                {conversation.unread && conversation.unreadCount && conversation.unreadCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 border-2 border-card rounded-full flex items-center justify-center">
                    <span className="sr-only">Unread messages</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {channelIcon(conversation.channel)}
                    <h3 className={cn(
                      "text-sm font-medium truncate",
                      conversation.unread ? "font-semibold" : "font-normal"
                    )}>
                      {conversation.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-none ml-2">
                    <span className={cn(
                      "text-xs whitespace-nowrap",
                      conversation.unread ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                      {conversation.time}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateLabel(conversation.lastTimestamp)}
                  </span>
                  {conversation.timeRemainingLabel ? (
                    <span className="text-[11px] text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                      Window open · {conversation.timeRemainingLabel}
                    </span>
                  ) : conversation.requiresTemplate ? (
                    <span className="text-[11px] text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                      Template required
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-xs truncate",
                    conversation.unread ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {conversation.lastMessage}
                  </p>
                  {conversation.unreadCount && conversation.unreadCount > 0 && (
                    <span className="flex-none inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
