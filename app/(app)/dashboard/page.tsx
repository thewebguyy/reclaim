export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI Cards will go here in Phase 6 */}
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Recovered This Month</p>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Inbox</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Follow-Ups Today</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">Coming soon in Phase 2...</p>
        </div>
      </div>
    </div>
  );
}
