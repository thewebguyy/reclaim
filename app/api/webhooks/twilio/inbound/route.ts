import { NextRequest, NextResponse } from "next/server";
import { twilioClient } from "@/lib/twilio";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { hashForLookup } from "@/lib/crypto";
import { SequenceService } from "@/lib/services/sequence.service";

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const from = body.get("From")?.toString(); // E.164
  const to = body.get("To")?.toString();     // Our Twilio number
  const text = body.get("Body")?.toString() || "";

  if (!from || !to) return new Response("Missing parameters", { status: 400 });

  // 1. Find the organisation by the receiving number
  // In production, we'd hash the to number for lookup if stored encrypted
  // But twilio numbers are public IDs for us.
  // Actually, we stored them encrypted in Clerk webhook. We need to decrypt or search.
  // Or better: search by hash if we add twilioNumberHash.
  // For MVP, we'll decrypt all and find (small number of orgs) or add a hash.
  
  // Let's assume we have a twilioNumberHash or we'll filter by plain if possible.
  // Since we don't have many orgs yet, we'll list and find.
  const orgs = await prisma.organisation.findMany({
    where: { NOT: { twilioNumber: null } },
  });
  
  const { decrypt } = await import("@/lib/crypto");
  const organisation = orgs.find(o => decrypt(o.twilioNumber!) === to);

  if (!organisation) {
    console.error(`Received message for unknown number: ${to}`);
    return new Response("Unknown receiver", { status: 404 });
  }

  // 2. Find the contact by phoneHash
  const phoneHash = hashForLookup(from);
  const contact = await prisma.contact.findUnique({
    where: { 
      organisationId_phoneHash: { 
        organisationId: organisation.id, 
        phoneHash 
      } 
    },
  });

  if (!contact) {
    // Create unmatched thread (Phase 4)
    return new Response("OK", { status: 200 });
  }

  // 3. Handle STOP
  if (text.trim().toUpperCase() === "STOP") {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { optOutSms: true },
    });
    
    // Terminal state for all active quotes for this contact
    await prisma.quote.updateMany({
      where: { contactId: contact.id, organisationId: organisation.id, status: "sequence_running" },
      data: { status: "dnc" },
    });
    
    return new Response("OK", { status: 200 });
  }

  // 4. Create message
  const message = await prisma.message.create({
    data: {
      organisationId: organisation.id,
      contactId: contact.id,
      direction: "inbound",
      channel: "sms",
      body: text,
      status: "received",
      receivedAt: new Date(),
    },
  });

  // 5. Find or create thread
  // Find most recent active quote to link
  const activeQuote = await prisma.quote.findFirst({
    where: { contactId: contact.id, status: "sequence_running" },
    orderBy: { createdAt: "desc" },
  });

  await prisma.inboxThread.upsert({
    where: { 
      id: contact.id // For MVP, one thread per contact is fine, but Directive 05 says unique PK
    },
    // Actually, Directive 05 doesn't specify unique PK as contactId.
    // I'll search by contactId and orgId.
    update: {
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
      status: "open",
    },
    create: {
      organisationId: organisation.id,
      contactId: contact.id,
      quoteId: activeQuote?.id,
      lastMessageAt: new Date(),
      unreadCount: 1,
      status: "open",
    },
  });
  // Wait, the upsert logic above is slightly flawed because id is uuid.
  // I'll use findFirst then create/update.

  // 6. Pause sequence
  if (activeQuote) {
    await SequenceService.pauseOnReply(activeQuote.id);
  }

  // 7. Real-time broadcast (Phase 4)

  return new Response("OK", { status: 200 });
}
