import { useGetDashboardSummary, useGetWardSupport, useGetRecentActivity } from "@workspace/api-client-react";
import { Users, FileText, UserCheck, Share2, DollarSign, Radio, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ label, value, icon: Icon, sub, color = "primary" }: {
  label: string; value: string | number; icon: React.ElementType; sub?: string; color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
        color === "primary" && "bg-primary/10 text-primary",
        color === "green" && "bg-green-100 text-green-700",
        color === "amber" && "bg-amber-100 text-amber-700",
        color === "blue" && "bg-blue-100 text-blue-700",
        color === "red" && "bg-red-100 text-red-700",
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-foreground leading-none">{typeof value === "number" ? value.toLocaleString() : value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-primary font-medium mt-1">{sub}</div>}
      </div>
    </div>
  );
}

const ZONE_COLORS: Record<string, string> = { green: "bg-green-500", yellow: "bg-amber-400", red: "bg-red-500" };
const ZONE_BG: Record<string, string> = { green: "bg-green-50 border-green-200", yellow: "bg-amber-50 border-amber-200", red: "bg-red-50 border-red-200" };
const ZONE_LABELS: Record<string, string> = { green: "Strong", yellow: "Needs Work", red: "Cold Zone" };
const ACTIVITY_ICONS: Record<string, React.ElementType> = { voter: Users, request: FileText, request_update: FileText, broadcast: Radio, volunteer: UserCheck };

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: wards, isLoading: loadingWards } = useGetWardSupport();
  const { data: activity } = useGetRecentActivity();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Live campaign intelligence</p>
      </div>

      {loadingSummary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-4 h-24 animate-pulse" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Confirmed Supporters" value={summary.confirmedSupporters} icon={CheckCircle} color="green" sub={`of ${summary.totalVoters.toLocaleString()} voters`} />
          <StatCard label="Leaning Supporters" value={summary.leaningSupporters} icon={TrendingUp} color="amber" />
          <StatCard label="Pending Requests" value={summary.pendingRequests} icon={FileText} color="red" sub="Need action" />
          <StatCard label="Active Volunteers" value={summary.totalVolunteers} icon={UserCheck} color="blue" />
          <StatCard label="Total Referrals" value={summary.totalReferrals} icon={Share2} color="primary" />
          <StatCard label="Campaign Balance" value={`KSh ${(summary.campaignBalance / 1000).toFixed(0)}K`} icon={DollarSign} color="green" />
          <StatCard label="Broadcasts (Month)" value={summary.broadcastsThisMonth} icon={Radio} color="blue" />
          <StatCard label="Total Voters" value={summary.totalVoters} icon={Users} color="primary" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Live Ward Intelligence Map</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Strong</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Needs Work</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Cold Zone</span>
            </div>
          </div>
          {loadingWards ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {wards?.map((ward) => (
                <div key={ward.ward} className={cn("border rounded-lg p-3", ZONE_BG[ward.zone] || "bg-muted/30 border-border")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", ZONE_COLORS[ward.zone] || "bg-muted-foreground")} />
                      <span className="font-semibold text-sm text-foreground">{ward.ward}</span>
                    </div>
                    <span className={cn("font-bold text-sm", ward.zone === "green" ? "text-green-700" : ward.zone === "yellow" ? "text-amber-700" : "text-red-700")}>
                      {ward.supportPercent}% — {ZONE_LABELS[ward.zone]}
                    </span>
                  </div>
                  {ward.total > 0 && (
                    <div className="flex gap-1 mb-1.5">
                      <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${(ward.confirmed / ward.total) * 100}%` }} />
                      <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${(ward.leaning / ward.total) * 100}%` }} />
                      <div className="h-1.5 rounded-full bg-slate-300 transition-all" style={{ width: `${(ward.undecided / ward.total) * 100}%` }} />
                      <div className="h-1.5 rounded-full bg-red-400 transition-all" style={{ width: `${(ward.opposed / ward.total) * 100}%` }} />
                    </div>
                  )}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="text-green-700 font-medium">{ward.confirmed} confirmed</span>
                    <span className="text-amber-700">{ward.leaning} leaning</span>
                    <span>{ward.undecided} undecided</span>
                    <span className="text-red-600">{ward.opposed} opposed</span>
                  </div>
                </div>
              ))}
              {(!wards || wards.length === 0) && <p className="text-sm text-muted-foreground text-center py-8">No voter data yet</p>}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activity?.slice(0, 8).map((item) => {
              const Icon = ACTIVITY_ICONS[item.type] || AlertTriangle;
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            {(!activity || activity.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
