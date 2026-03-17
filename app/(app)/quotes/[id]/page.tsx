import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { StatusBadge } from "@/components/quotes/quote-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, User, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { orgId } = await auth();
  if (!orgId) return null;

  const organisation = await prisma.organisation.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!organisation) return null;

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!quote || quote.organisationId !== organisation.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quotes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Quote Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">{quote.title}</CardTitle>
              <StatusBadge status={quote.status} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${Number(quote.amount).toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Sent on {format(new Date(quote.sentAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quote.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No follow-ups sent yet.</p>
                ) : (
                  quote.messages.map((msg) => (
                    <div key={msg.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                        <div className="h-full w-px bg-border my-1" />
                      </div>
                      <div className="flex-1 space-y-1 pb-4">
                        <p className="text-sm font-medium">Outbound SMS Sent</p>
                        <p className="text-sm text-muted-foreground">{msg.body}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {quote.contact.firstName} {quote.contact.lastName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Email protected (PII)</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Phone protected (PII)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full">Reply to Customer</Button>
              <Button variant="outline" className="w-full">Mark as Won</Button>
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive">Stop Following Up</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
