import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { BillingService } from "@/lib/services/billing.service";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId } = await req.json();

  const organisation = await prisma.organisation.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!organisation) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  try {
    const session = await BillingService.createCheckoutSession({
      organisationId: organisation.id,
      clerkOrgId: orgId,
      priceId,
      successUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/settings/billing?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
