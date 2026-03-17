import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { QuoteService } from "@/lib/services/quote.service";
import { parseHCPQuote } from "@/lib/parsers/hcp.parser";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const signature = req.headers.get("X-HCP-Signature"); // Placeholder for actual HCP header

  // In production, validate HCP signature/secret
  if (env.HCP_WEBHOOK_SECRET && signature !== env.HCP_WEBHOOK_SECRET) {
    // return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const organisationId = searchParams.get("orgId");

  if (!organisationId) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 400 });
  }

  try {
    const event = body.event_type;

    if (event === "estimate.sent") {
      const parsed = parseHCPQuote(body.payload);
      await QuoteService.ingest(organisationId, parsed);
    }

    if (event === "estimate.approved") {
      const externalId = body.payload.id.toString();
      await prisma.quote.update({
        where: {
          organisationId_externalId_externalSource: {
            organisationId,
            externalId,
            externalSource: "housecall_pro",
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
    console.error("HCP webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
