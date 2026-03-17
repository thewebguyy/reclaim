import { NextRequest, NextResponse } from "next/server";
import { qstashReceiver, QStashStepPayload } from "@/lib/qstash";
import prisma from "@/lib/prisma";
import { PersonalisationService } from "@/lib/services/personalisation.service";
import { twilioClient } from "@/lib/twilio";
import { resend } from "@/lib/resend";
import { decrypt } from "@/lib/crypto";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("Upstash-Signature");

  if (!signature || !await qstashReceiver.verify({ body, signature })) {
    return NextResponse.json({ error: "Invalid qstash signature" }, { status: 401 });
  }

  const payload = JSON.parse(body) as QStashStepPayload;

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: payload.quoteId },
      include: {
        organisation: true,
        contact: true,
        sequence: {
          include: { steps: { where: { stepNumber: payload.stepNumber } } },
        },
      },
    });

    if (!quote || !quote.sequence || quote.sequence.steps.length === 0) {
      return NextResponse.json({ error: "Quote or step not found" }, { status: 404 });
    }

    // Idempotency check: only send if cursor matches prev step
    if (quote.sequenceStepCursor !== payload.stepNumber - 1) {
      return NextResponse.json({ message: "Already processed or skipped" });
    }

    // Skip if paused or won
    if (quote.sequencePausedAt || quote.status === "converted" || quote.status === "dnc") {
      return NextResponse.json({ message: "Sequence paused or terminal state" });
    }

    const step = quote.sequence.steps[0];
    const contact = quote.contact;
    const org = quote.organisation;

    // 1. Personalise
    const personalisedBody = await PersonalisationService.personaliseMessage({
      templateId: step.id,
      contactId: contact.id,
      businessName: org.name,
      industry: org.industry,
      firstName: contact.firstName || "there",
      jobTitle: quote.title || "the job",
      amount: Number(quote.amount),
      template: step.smsTemplate || "",
    });

    // 2. Send SMS
    if (step.channelSms && contact.phoneEnc && org.twilioNumber) {
      const phoneNumber = decrypt(contact.phoneEnc);
      const twilioNumber = decrypt(org.twilioNumber);

      const message = await twilioClient.messages.create({
        from: twilioNumber,
        to: phoneNumber,
        body: personalisedBody,
      });

      // 3. Log Outbound Message
      await prisma.message.create({
        data: {
          organisationId: org.id,
          contactId: contact.id,
          quoteId: quote.id,
          direction: "outbound",
          channel: "sms",
          body: personalisedBody,
          status: "sent",
          providerId: message.sid,
          sequenceStepNo: step.stepNumber,
          sentAt: new Date(),
        },
      });
    }

    // 4. Update Cursor
    await prisma.quote.update({
      where: { id: quote.id },
      data: { sequenceStepCursor: payload.stepNumber },
    });

    // 5. Schedule Next Step
    const nextStep = await prisma.sequenceStep.findUnique({
      where: {
        sequenceId_stepNumber: {
          sequenceId: quote.sequenceId!,
          stepNumber: payload.stepNumber + 1,
        },
      },
    });

    if (nextStep) {
      await qstash.publishJSON({
        url: `${env.NEXT_PUBLIC_APP_URL}/api/qstash/sequence-step`,
        body: {
          ...payload,
          stepNumber: payload.stepNumber + 1,
        } as QStashStepPayload,
        delay: nextStep.delayHours * 3600,
      });
    } else {
      // Mark sequence completed if no more steps
      await prisma.quote.update({
        where: { id: quote.id },
        data: { sequenceCompletedAt: new Date(), status: "expired" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sequence step executor error:", error);
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}

// QStash helpers
const qstash = {
  publishJSON: async (params: any) => {
    // Actual implementation in lib/qstash.ts
    const { qstash } = await import("@/lib/qstash");
    return qstash.publishJSON(params);
  }
};
