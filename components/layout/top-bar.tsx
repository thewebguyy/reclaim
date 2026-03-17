"use client";

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-8">
      <div className="flex items-center gap-4">
        <OrganizationSwitcher 
          afterCreateOrganizationUrl="/onboarding/profile"
          appearance={{
            elements: {
              rootBox: "flex items-center justify-center",
              organizationSwitcherTrigger: "py-1 px-2 border rounded-md"
            }
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
