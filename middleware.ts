import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

// Create Redis client for rate limiting
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Create rate limiter: 100 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "10 s"),
  analytics: true,
});

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
  "/api/qstash(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)", // Initial onboarding might be public or hand-off
]);

const isApiRoute = createRouteMatcher(["/api/v1(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Apply rate limiting to all requests
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    });
  }

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    (await auth()).protect();
  }

  // For API routes, we can ensure there's an organization ID or other specific requirements
  if (isApiRoute(req)) {
    const { orgId, userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User is not authenticated" } },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
