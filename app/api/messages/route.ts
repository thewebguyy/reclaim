import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  if (!threadId) return NextResponse.json({ error: "Thread ID required" }, { status: 400 });

  // For MVP, thread ID is the contactId
  const messages = await prisma.message.findMany({
    where: { contactId: threadId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}
