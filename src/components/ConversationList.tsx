import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, MessageCircle, Home } from "lucide-react";

type ConversationItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  channel: string;
  unread: boolean;
  unreadCount?: number;
};

const channelIcon = (channel: string) => {
  switch (channel) {
    case "whatsapp":
      return <Phone size={18} style={{ color: "#25D366" }} />;
    case "instagram":
      return <MessageCircle size={18} style={{ color: "#E1306C" }} />;
    case "website":
      return <Home size={18} style={{ color: "#0078FF" }} />;
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
    filtered = filtered.filter((c) => parseInt(c.id) % 2 === 0); // Example: "Mine" = even IDs
  } else if (tab === "unassigned") {
    filtered = filtered.filter((c) => parseInt(c.id) % 2 !== 0); // Example: "Unassigned" = odd IDs
  }
  if (search.trim()) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase())
    );
  }

  return (
    <aside className={`flex flex-col ${isMobile ? "w-full" : "w-72"} border-r border-border bg-card overflow-hidden`}>
      <div className="flex items-center justify-between h-16 border-b border-border px-4 shrink-0">
        <span className="font-semibold text-lg">Conversations</span>
        <span className="text-xs text-muted-foreground">{conversations.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-2 shrink-0">
        <Input
          placeholder="Search for messages"
          className="bg-muted border-0"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full flex bg-muted p-1" style={{ borderRadius: 5 }}>
            <TabsTrigger
              value="all"
              className="flex-1 text-xs px-3 py-1"
              style={{ borderRadius: 5 }}
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="mine"
              className="flex-1 text-xs px-3 py-1"
              style={{ borderRadius: 5 }}
            >
              Mine
            </TabsTrigger>
            <TabsTrigger
              value="unassigned"
              className="flex-1 text-xs px-3 py-1"
              style={{ borderRadius: 5 }}
            >
              Unassigned
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
        <ul className="px-2 pb-4">
          {filtered.length === 0 && (
            <li className="text-center text-xs text-muted-foreground py-8">No conversations found.</li>
          )}
          {filtered.map((c) => (
            <li
              key={c.id}
              className={`flex flex-col gap-1 px-3 py-2 rounded cursor-pointer mb-1 ${
                selectedId === c.id ? "bg-accent text-accent-foreground" : "hover:bg-accent"
              }`}
              onClick={() => onSelect(c.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {channelIcon(c.channel)}
                  <span className="font-medium text-sm">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{c.time}</span>
                  {(c.unreadCount ?? 0) > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground truncate">{c.lastMessage}</span>
            </li>
          ))}
        </ul>
        </ScrollArea>
      </div>
    </aside>
  );
};