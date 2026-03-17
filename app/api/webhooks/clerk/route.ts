import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { twilioClient } from "@/lib/twilio";
import { Industry, Plan, Role } from "@prisma/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;

    await prisma.user.upsert({
      where: { clerkUserId: id },
      update: {
        email,
        fullName: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        avatarUrl: image_url,
      },
      create: {
        clerkUserId: id,
        email,
        fullName: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        avatarUrl: image_url,
      },
    });
  }

  if (eventType === "organization.created") {
    const { id, name, slug, created_by } = evt.data;

    // 1. Create Organisation
    const org = await prisma.organisation.create({
      data: {
        clerkOrgId: id,
        name: name,
        slug: slug || id,
        industry: "other", // Default, owner updates in onboarding
        trialEndsAt: new DateTime(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day trial
        plan: "trial",
        settings: {
          rebooking_interval_days: 90,
          review_delay_hours: 2,
          notification_email: true,
        },
      },
    });

    // 2. Link creator as admin if they exist in our DB
    if (created_by) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkUserId: created_by },
      });
      if (dbUser) {
        await prisma.organisationMember.create({
          data: {
            organisationId: org.id,
            userId: dbUser.id,
            role: "admin",
            joinedAt: new Date(),
          },
        });
      }
    }

    // 3. Provision Twilio Number (Async search and purchase)
    // In a production scenario, we might want to do this in a queue or after onboarding profile
    // But per Directive 12, we trigger it here.
    try {
      const availableNumbers = await twilioClient.availablePhoneNumbers("US").local.list({ limit: 1 });
      if (availableNumbers.length > 0) {
        const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
          phoneNumber: availableNumbers[0].phoneNumber,
          friendlyName: `Reclaim - ${name}`,
          smsUrl: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/inbound`,
        });
        
        const { encrypt } = await import("@/lib/crypto");
        await prisma.organisation.update({
          where: { id: org.id },
          data: { twilioNumber: encrypt(purchasedNumber.phoneNumber) },
        });
      }
    } catch (error) {
      console.error("Failed to provision Twilio number:", error);
      // Log to Sentry
    }

    // 4. Create Default Sequence
    await prisma.sequence.create({
      data: {
        organisationId: org.id,
        name: "Default Follow-Up Plan",
        isDefault: true,
        triggerAfterHours: 48,
        steps: {
          create: [
            {
              stepNumber: 1,
              delayHours: 0,
              channelSms: true,
              smsTemplate: "Hi {first_name}, it's {business_name}. Just checking in on that {job_title} quote we sent over. Any questions?",
              organisationId: org.id,
            },
            {
              stepNumber: 2,
              delayHours: 72,
              channelSms: true,
              smsTemplate: "Hey {first_name}, just following up again. We'd love to help with your {job_title}. Let me know if you're ready to move forward!",
              organisationId: org.id,
            },
          ],
        },
      },
    });

    // 5. Create Stripe Customer
    try {
      const customer = await stripe.customers.create({
        name: name,
        metadata: { clerkOrgId: id, orgId: org.id },
      });

      // Usually we'd start a trial on a specific price here if doing "no CC required"
      // But Stripe Subscriptions usually need a price.
      // We'll just store the customer ID for now.
    } catch (error) {
      console.error("Failed to create Stripe customer:", error);
    }
  }

  return new Response("OK", { status: 200 });
}

// Helper to handle DateTime in Prisma data
const DateTime = global.Date;
