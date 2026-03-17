import prisma from "../prisma";
import { twilioClient } from "../twilio";
import { resend } from "../resend";
import { decrypt, encrypt } from "../crypto";

export class InboxService {
  static async listThreads(organisationId: string) {
    return await prisma.inboxThread.findMany({
      where: { organisationId },
      include: {
        contact: true,
        quote: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });
  }

  static async sendMessage(params: {
    organisationId: string;
    contactId: string;
    quoteId?: string;
    channel: "sms" | "email";
    body: string;
  }) {
    const org = await prisma.organisation.findUnique({
      where: { id: params.organisationId },
    });
    const contact = await prisma.contact.findUnique({
      where: { id: params.contactId },
    });

    if (!org || !contact) throw new Error("Org or Contact not found");

    let providerId = "";

    if (params.channel === "sms") {
      if (!org.twilioNumber || !contact.phoneEnc) throw new Error("Numbers not configured");
      const from = decrypt(org.twilioNumber);
      const to = decrypt(contact.phoneEnc);

      const message = await twilioClient.messages.create({
        from,
        to,
        body: params.body,
      });
      providerId = message.sid;
    } else {
      // Email implementation (Simplified for MVP)
      if (!contact.emailEnc) throw new Error("Email not configured");
      const to = decrypt(contact.emailEnc);
      const { data, error } = await resend.emails.send({
        from: `Reclaim <${org.replyEmail || "followup@reclaim.app"}>`,
        to,
        subject: "Follow Up",
        text: params.body,
      });
      if (error) throw error;
      providerId = data?.id || "";
    }

    // Save message
    const msg = await prisma.message.create({
      data: {
        organisationId: org.id,
        contactId: contact.id,
        quoteId: params.quoteId,
        direction: "outbound",
        channel: params.channel,
        body: params.body,
        status: "sent",
        providerId,
        sentAt: new Date(),
      },
    });

    // Update thread
    await prisma.inboxThread.upsert({
      where: { id: contact.id }, // Simple mapping for MVP
      update: {
        lastMessageAt: new Date(),
        status: "open",
      },
      create: {
        organisationId: org.id,
        contactId: contact.id,
        quoteId: params.quoteId,
        lastMessageAt: new Date(),
        status: "open",
      },
    });

    return msg;
  }
}
