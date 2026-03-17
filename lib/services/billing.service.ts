import { stripe } from "../stripe";
import prisma from "../prisma";
import { env } from "../env";

export class BillingService {
  static async createCheckoutSession(params: {
    organisationId: string;
    clerkOrgId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const org = await prisma.organisation.findUnique({
      where: { id: params.organisationId },
    });

    if (!org) throw new Error("Org not found");

    const session = await stripe.checkout.sessions.create({
      customer: org.stripeCustomerId || undefined,
      mode: "subscription",
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        organisationId: params.organisationId,
        clerkOrgId: params.clerkOrgId,
      },
    });

    return session;
  }

  static async handleWebhook(payload: any, signature: string) {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const orgId = session.metadata.organisationId;
        
        await prisma.organisation.update({
          where: { id: orgId },
          data: {
            plan: "growth", // Simplified
            subscriptionId: session.subscription,
            trialEndsAt: null,
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        await prisma.organisation.updateMany({
          where: { subscriptionId: sub.id },
          data: { plan: "starter" },
        });
        break;
      }
    }

    return { received: true };
  }
}
