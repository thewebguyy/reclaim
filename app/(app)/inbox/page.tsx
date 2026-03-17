import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { InboxService } from "@/lib/services/inbox.service";
import { ThreadList } from "@/components/inbox/thread-list";
import { ChatWindow } from "@/components/inbox/chat-window";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { t?: string };
}) {
  const { orgId } = await auth();
  if (!orgId) return null;

  const organisation = await prisma.organisation.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!organisation) return null;

  const threads = await InboxService.listThreads(organisation.id);
  const selectedThreadId = searchParams.t;
  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.32))] gap-0 -m-8 overflow-hidden rounded-none border-t">
      <div className="flex w-80 flex-col border-r bg-muted/10">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search messages..."
              className="pl-8 bg-background"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ThreadList threads={threads as any} selectedId={selectedThreadId} />
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-background">
        {selectedThread ? (
          <ChatWindow thread={selectedThread as any} organisationId={organisation.id} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground flex-col gap-2">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-6 w-6" />
            </div>
            <p>Select a thread to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
