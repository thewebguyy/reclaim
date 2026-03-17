"use client";

import { Contact, InboxThread, Message } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ThreadListProps {
  threads: (InboxThread & { 
    contact: Contact; 
    messages: Message[] 
  })[];
  selectedId?: string;
}

export function ThreadList({ threads, selectedId }: ThreadListProps) {
  return (
    <div className="divide-y">
      {threads.map((thread) => {
        const lastMessage = thread.messages[0];
        const isSelected = thread.id === selectedId;
        
        return (
          <Link
            key={thread.id}
            href={`/inbox?t=${thread.id}`}
            className={cn(
              "flex flex-col gap-1 p-4 text-sm transition-colors hover:bg-muted/50",
              isSelected && "bg-accent"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {thread.contact.firstName} {thread.contact.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
              </span>
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {lastMessage?.body || "No messages yet"}
            </p>
            {thread.unreadCount > 0 && (
              <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {thread.unreadCount}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
