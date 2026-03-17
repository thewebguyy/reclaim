import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { QuoteRow } from "@/components/quotes/quote-row";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuoteStatus } from "@prisma/client";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { orgId } = await auth();
  if (!orgId) return null;

  const organisation = await prisma.organisation.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!organisation) return null;

  const statusFilter = searchParams.status as QuoteStatus | undefined;

  const quotes = await prisma.quote.findMany({
    where: {
      organisationId: organisation.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      contact: true,
    },
    orderBy: {
      sentAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
      </div>

      <div className="flex flex-col gap-4">
        <Tabs defaultValue={statusFilter || "all"}>
          <TabsList>
            <TabsTrigger value="all" asChild>
              <a href="/quotes">All</a>
            </TabsTrigger>
            <TabsTrigger value="sequence_running" asChild>
              <a href="/quotes?status=sequence_running">Following Up</a>
            </TabsTrigger>
            <TabsTrigger value="engaged" asChild>
              <a href="/quotes?status=engaged">Replied</a>
            </TabsTrigger>
            <TabsTrigger value="converted" asChild>
              <a href="/quotes?status=converted">Won</a>
            </TabsTrigger>
            <TabsTrigger value="expired" asChild>
              <a href="/quotes?status=expired">Expired</a>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No quotes found.
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <QuoteRow key={quote.id} quote={quote as any} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
