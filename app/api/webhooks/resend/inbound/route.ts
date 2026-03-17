import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashForLookup } from "@/lib/crypto";
import { SequenceService } from "@/lib/services/sequence.service";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Resend Inbound Parse payload
  const fromEmail = body.from;
  const toEmail = body.to; // Our reply-to address
  const text = body.text;
  const html = body.html;

  // Extract E-mail from "Name <email@domain.com>"
  const emailMatch = fromEmail.match(/<(.+)>|(\S+@\S+)/);
  const from = emailMatch ? (emailMatch[1] || emailMatch[2]) : fromEmail;

  // 1. Find organisation by the receiving email
  const organisation = await prisma.organisation.findFirst({
    where: { replyEmail: toEmail },
  });

  if (!organisation) return new Response("Unknown receiver", { status: 404 });

  // 2. Find the contact by emailHash
  const emailHash = hashForLookup(from);
  const contact = await prisma.contact.findUnique({
    where: { 
      organisationId_emailHash: { 
        organisationId: organisation.id, 
        emailHash 
      } 
    },
  });

  if (!contact) return new Response("OK", { status: 200 });

  // 3. Create message
  await prisma.message.create({
    data: {
      organisationId: organisation.id,
      contactId: contact.id,
      direction: "inbound",
      channel: "email",
      emailHtml: html,
      body: text,
      status: "received",
      receivedAt: new Date(),
    },
  });

  // 4. Pause sequence
  const activeQuote = await prisma.quote.findFirst({
    where: { contactId: contact.id, status: "sequence_running" },
    orderBy: { createdAt: "desc" },
  });

  if (activeQuote) {
    await SequenceService.pauseOnReply(activeQuote.id);
  }

  return new Response("OK", { status: 200 });
}
