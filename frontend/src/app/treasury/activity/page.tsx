"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { getTreasuryActivity } from "@/services/treasury.service";
import { Activity, ArrowRightLeft, Landmark, FileText, CheckCircle2, XCircle } from "lucide-react";

export default function ActivityWorkspacePage() {
  const { data: activityFeed, isLoading } = useQuery({
    queryKey: ["treasury", "activity"],
    queryFn: () => getTreasuryActivity(100),
  });

  const formatCurrency = (amount: string | number | undefined) => {
    if (amount === undefined) return "";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount));
  };

  const getIconForActivity = (type: string) => {
    if (type.includes("TRANSFER")) return <ArrowRightLeft className="h-5 w-5 text-blue-500" />;
    if (type.includes("ADVANCE")) return <FileText className="h-5 w-5 text-purple-500" />;
    if (type.includes("SETTLEMENT")) return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (type.includes("COUNT")) return <Landmark className="h-5 w-5 text-amber-500" />;
    if (type.includes("REVERSED")) return <XCircle className="h-5 w-5 text-rose-500" />;
    return <Activity className="h-5 w-5 text-slate-500" />;
  };

  return (
    <AppShell activePath="/treasury/activity">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Treasury Activity</h2>
            <p className="text-muted-foreground mt-1">Real-time feed of all financial movements and status changes.</p>
          </div>
        </div>

        <Card className="max-w-4xl border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading activity feed...</div>
            ) : activityFeed && activityFeed.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                {activityFeed.map((activity, idx) => (
                  <div key={activity.id || idx} className="relative flex items-start gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full border-[4px] border-slate-50 bg-white shadow-sm z-10 shrink-0">
                        {getIconForActivity(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 pt-2 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-base text-slate-900">{activity.title}</span>
                        <span className="text-sm text-slate-500 bg-white px-2 py-0.5 rounded-md border">
                          {format(new Date(activity.date), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                        {activity.description}
                      </p>
                      {activity.reference && (
                        <p className="text-xs font-mono text-slate-400 mt-3 uppercase tracking-wider">
                          Ref: {activity.reference}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center bg-white border rounded-xl shadow-sm">
                <Activity className="h-10 w-10 text-slate-200 mb-4" />
                <p className="text-sm font-medium text-slate-900">No recent activity</p>
                <p className="text-sm text-slate-500 mt-1">Actions taken within the treasury module will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
