import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function FollowUpsPage() {
  const { orgId } = await auth();
  if (!orgId) return null;

  const organisation = await prisma.organisation.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!organisation) return null;

  const sequences = await prisma.sequence.findMany({
    where: { organisationId: organisation.id },
    include: {
      _count: {
        select: {
          quotes: {
            where: { status: "sequence_running" },
          },
        },
      },
      steps: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow-Up Plans</h1>
          <p className="text-muted-foreground">Manage how you automatically reach back out to customers.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sequences.map((sequence) => (
          <Card key={sequence.id} className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              {sequence.isDefault && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Default
                </Badge>
              )}
            </div>
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                {sequence.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active quotes</span>
                  <span className="font-medium">{sequence._count.quotes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Steps</span>
                  <span className="font-medium">{sequence.steps.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg. reply rate</span>
                  <span className="font-medium text-emerald-600">--%</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Starts {sequence.triggerAfterHours} hours after quote is sent.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/follow-ups/${sequence.id}/edit`}>
                      Edit Plan
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sequences.length === 0 && (
          <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center text-muted-foreground col-span-full">
            <Zap className="h-12 w-12 mb-4 opacity-20" />
            <p>No follow-up plans created yet.</p>
            <Button variant="link" className="mt-2">Create your first plan</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
