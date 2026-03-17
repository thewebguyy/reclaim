import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Recovered This Month</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">$12,450.00</p>
            <span className="text-xs text-emerald-600 font-medium">+12%</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
          <p className="text-2xl font-bold">$45,200.00</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Inbox</p>
          <p className="text-2xl font-bold">4</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Follow-Ups Today</p>
          <p className="text-2xl font-bold">12</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueChart />
        </div>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">John Doe Accepted HVAC Install</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                  <div className="text-sm font-bold text-foreground">+$1,200</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
