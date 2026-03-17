"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Inbox, 
  Quote, 
  Settings, 
  ShieldCheck, 
  Users, 
  Zap,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Quotes", href: "/quotes", icon: Quote },
  { name: "Inbox", href: "/inbox", icon: Inbox },
  { name: "Follow-Up Plans", href: "/follow-ups", icon: Zap },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

const settingsNav = [
  { name: "Settings", href: "/settings/profile", icon: Settings },
  { name: "Team", href: "/settings/team", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
          <ShieldCheck className="h-6 w-6" />
          <span className="text-xl tracking-tight">Reclaim</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-4 py-4">
        <div className="space-y-1">
          {settingsNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
