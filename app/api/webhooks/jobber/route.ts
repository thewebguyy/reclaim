import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/env";
import { QuoteService } from "@/lib/services/quote.service";
import { parseJobberQuote } from "@/lib/parsers/jobber.parser";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("X-Jobber-Hmac-SHA256");

  if (!signature || !validateJobberSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const event = payload.topic;

  // Find organisation by Jobber application context or custom header if provided
  // For MVP, we'll assume the webhook URL contains the org ID: /api/webhooks/jobber?orgId=...
  const { searchParams } = new URL(req.url);
  const organisationId = searchParams.get("orgId");

  if (!organisationId) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 400 });
  }

  try {
    if (event === "quote.sent") {
      const parsed = parseJobberQuote(payload.data);
      await QuoteService.ingest(organisationId, parsed);
    }

    if (event === "quote.accepted") {
      const externalId = payload.data.id.toString();
      await prisma.quote.update({
        where: {
          organisationId_externalId_externalSource: {
            organisationId,
            externalId,
            externalSource: "jobber",
          },
        },
        data: {
          status: "converted",
          convertedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Jobber webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function validateJobberSignature(body: string, signature: string): boolean {
  const hmac = crypto
    .createHmac("sha256", env.JOBBER_WEBHOOK_SECRET)
    .update(body)
    .digest("base64");
  return hmac === signature;
}
