import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WEBHOOK_SECRET: z.string().min(1),

  // Resend
  RESEND_API_KEY: z.string().min(1),
  RESEND_WEBHOOK_SECRET: z.string().min(1),
  RESEND_INBOUND_DOMAIN: z.string().min(1),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_STARTER_PRICE_ID: z.string().min(1),
  STRIPE_GROWTH_PRICE_ID: z.string().min(1),

  // Upstash QStash
  QSTASH_URL: z.string().url(),
  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),

  // Upstash Redis (for rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64), // 32-byte hex
  HASH_KEY: z.string().length(64),       // 32-byte hex

  // Jobber
  JOBBER_CLIENT_ID: z.string().min(1),
  JOBBER_CLIENT_SECRET: z.string().min(1),
  JOBBER_WEBHOOK_SECRET: z.string().min(1),

  // Housecall Pro
  HCP_WEBHOOK_SECRET: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(_env.error.format(), null, 2)
  );
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
