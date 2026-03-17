import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { InboxService } from "@/lib/services/inbox.service";

export async function POST(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organisation = await prisma.organisation.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!organisation) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  try {
    const { contactId, quoteId, channel, body } = await req.json();

    const message = await InboxService.sendMessage({
      organisationId: organisation.id,
      contactId,
      quoteId,
      channel,
      body,
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
