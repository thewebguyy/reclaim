import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/lib/services/billing.service";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) return new Response("No signature", { status: 400 });

  try {
    await BillingService.handleWebhook(body, signature);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
