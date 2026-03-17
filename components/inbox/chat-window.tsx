"use client";

import { useEffect, useRef, useState } from "react";
import { Contact, InboxThread, Message, Quote } from "@prisma/client";
import { format } from "date-fns";
import { Send, Phone, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ChatWindowProps {
  thread: InboxThread & { 
    contact: Contact; 
    quote?: Quote | null;
  };
  organisationId: string;
}

export function ChatWindow({ thread, organisationId }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch full message history
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", thread.id],
    queryFn: async () => {
      // In a real app, this would be an API call
      // For now, we'll fetch from a Server Action or another API
      const res = await fetch(`/api/messages?threadId=${thread.id}`);
      return res.json();
    }
  });

  const mutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        body: JSON.stringify({
          contactId: thread.contactId,
          quoteId: thread.quoteId,
          channel: "sms", // Defaulting for MVP
          body,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["messages", thread.id] });
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || mutation.isPending) return;
    mutation.mutate(input);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {thread.contact.firstName[0]}
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {thread.contact.firstName} {thread.contact.lastName}
            </h3>
            <p className="text-xs text-muted-foreground">
              {thread.quote?.title || "No active quote"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><Mail className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5 font-sans"
      >
        {messages.map((message: any) => (
          <div
            key={message.id}
            className={cn(
              "flex w-max max-w-[80%] flex-col gap-1 rounded-lg px-4 py-2 text-sm",
              message.direction === "outbound"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <p>{message.body}</p>
            <span className="text-[10px] opacity-70">
              {format(new Date(message.createdAt), "h:mm a")}
            </span>
          </div>
        ))}
        {mutation.isPending && (
          <div className="ml-auto bg-primary/50 text-primary-foreground w-max max-w-[80%] rounded-lg px-4 py-2 text-sm">
            Sending...
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="relative">
          <Textarea
            placeholder="Type your reply..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[80px] resize-none pr-12"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            size="icon" 
            className="absolute right-2 bottom-2" 
            onClick={handleSend}
            disabled={!input.trim() || mutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
