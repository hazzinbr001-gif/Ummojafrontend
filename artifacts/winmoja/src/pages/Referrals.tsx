import { useListReferrals, useGetReferralLeaderboard, getListReferralsQueryKey, getGetReferralLeaderboardQueryKey } from "@workspace/api-client-react";
import { Trophy, Award, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  registered: "bg-green-100 text-green-800 border-green-200",
  attended_rally: "bg-blue-100 text-blue-800 border-blue-200",
};
const STATUS_LABELS: Record<string, string> = { pending: "Pending", registered: "Registered", attended_rally: "Attended Rally" };
const RANK_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-600"];

export default function Referrals() {
  const params = { page: 1, limit: 50 };
  const lbParams = { limit: 10 };
  const { data: referrals, isLoading: loadingReferrals } = useListReferrals(params, { query: { queryKey: getListReferralsQueryKey(params) } });
  const { data: leaderboard, isLoading: loadingLb } = useGetReferralLeaderboard(lbParams, { query: { queryKey: getGetReferralLeaderboardQueryKey(lbParams) } });
  const totalAirtime = leaderboard?.reduce((sum, e) => sum + e.totalAirtimeEarned, 0) ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referral Engine</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Viral poster sharing and supporter leaderboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-primary">{referrals?.total || 0}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Referrals</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600">{referrals?.data.filter(r => r.status === "registered").length || 0}</div>
          <div className="text-sm text-muted-foreground mt-1">Registered Supporters</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-amber-600">KSh {totalAirtime.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Airtime Distributed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-foreground">Top Referrers Leaderboard</h2>
          </div>
          {loadingLb ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div> : (
            <div className="space-y-2">
              {leaderboard?.map((entry) => (
                <div key={entry.rank} className={cn("flex items-center gap-3 p-3 rounded-lg border", entry.rank <= 3 ? "border-amber-200 bg-amber-50/50" : "border-border bg-muted/20")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                    entry.rank === 1 ? "bg-yellow-100 text-yellow-700" : entry.rank === 2 ? "bg-slate-100 text-slate-600" : entry.rank === 3 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                  )}>
                    {entry.rank <= 3 ? <Award className={cn("w-4 h-4", RANK_COLORS[entry.rank - 1])} /> : entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{entry.referrerName}</div>
                    <div className="text-xs text-muted-foreground">{entry.referrerPhone}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm text-primary">{entry.totalReferrals} referral{entry.totalReferrals !== 1 ? "s" : ""}</div>
                    <div className="text-xs text-muted-foreground">KSh {entry.totalAirtimeEarned}</div>
                  </div>
                </div>
              ))}
              {(!leaderboard || leaderboard.length === 0) && <p className="text-sm text-muted-foreground text-center py-8">No referrals recorded yet</p>}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">All Referrals</h2>
          </div>
          {loadingReferrals ? <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 font-semibold text-muted-foreground text-xs uppercase">Referrer</th>
                    <th className="text-left pb-2 font-semibold text-muted-foreground text-xs uppercase">Referred</th>
                    <th className="text-left pb-2 font-semibold text-muted-foreground text-xs uppercase">Status</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground text-xs uppercase">Airtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referrals?.data.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-3"><div className="font-medium text-foreground text-xs">{r.referrerName}</div><div className="text-muted-foreground text-xs">{r.referrerPhone}</div></td>
                      <td className="py-2.5 pr-3"><div className="text-xs text-foreground">{r.referredName || "—"}</div></td>
                      <td className="py-2.5 pr-3"><span className={cn("px-1.5 py-0.5 rounded text-xs border font-medium", STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600")}>{STATUS_LABELS[r.status] || r.status}</span></td>
                      <td className="py-2.5 text-right font-medium text-primary text-xs">KSh {r.airtimeEarned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
