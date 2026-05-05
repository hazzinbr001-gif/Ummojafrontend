import { useState } from "react";
import { useGetWardSupport, useListVoters, useUpdateVoter, getGetWardSupportQueryKey, getListVotersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SCHEDULE = [
  { time: "5:45 AM", action: "KSh 20 airtime sent to ALL confirmed supporters", impact: "Voter wakes up with airtime — remembers candidate", done: true, icon: "airtime" },
  { time: "6:00 AM", action: "Personalised SMS: name + polling station + motivation message", impact: "Voter feels seen and directed", done: true, icon: "sms" },
  { time: "8:00 AM", action: "Agent app shows who has voted per polling station", impact: "HQ knows exactly where to focus transport", done: false, icon: "agent" },
  { time: "12:00 PM", action: "Auto-reminder SMS to supporters not yet marked as voted", impact: "Midday push drives afternoon turnout", done: false, icon: "reminder" },
  { time: "3:00 PM", action: "Final push SMS to all remaining unvoted supporters", impact: "Last chance mobilisation", done: false, icon: "final" },
  { time: "5:00 PM", action: "Live dashboard: projected result by polling station", impact: "Campaign knows outcome before official count", done: false, icon: "result" },
];

const ZONE_COLORS: Record<string, string> = {
  green: "border-green-300 bg-green-50",
  yellow: "border-amber-300 bg-amber-50",
  red: "border-red-300 bg-red-50",
};

const ZONE_TEXT: Record<string, string> = {
  green: "text-green-700",
  yellow: "text-amber-700",
  red: "text-red-700",
};

export default function ElectionDay() {
  const [markingId, setMarkingId] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const wardParams = {};
  const voterParams = { page: 1, limit: 100 };
  const { data: wards } = useGetWardSupport({ query: { queryKey: getGetWardSupportQueryKey() } });
  const { data: voters } = useListVoters(voterParams, { query: { queryKey: getListVotersQueryKey(voterParams) } });
  const updateVoter = useUpdateVoter();

  const confirmed = voters?.data.filter(v => v.supportLevel === "confirmed") ?? [];
  const voted = confirmed.filter(v => v.hasVoted);
  const notVoted = confirmed.filter(v => !v.hasVoted);
  const turnoutPct = confirmed.length > 0 ? Math.round((voted.length / confirmed.length) * 100) : 0;

  const markVoted = (id: number) => {
    setMarkingId(id);
    updateVoter.mutate({ id, data: { hasVoted: true } }, {
      onSuccess: () => {
        toast({ title: "Voter marked as voted" });
        qc.invalidateQueries({ queryKey: getListVotersQueryKey() });
        setMarkingId(null);
      },
      onError: () => {
        toast({ title: "Failed to update voter", variant: "destructive" });
        setMarkingId(null);
      },
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-[hsl(222,47%,11%)] to-[hsl(222,47%,16%)] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Election Day Operations</h1>
            <p className="text-white/60 text-sm">Automated precision mobilisation — 2027 General Election</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{voted.length}</div>
            <div className="text-xs text-white/60 mt-0.5">Voted</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400">{notVoted.length}</div>
            <div className="text-xs text-white/60 mt-0.5">Not Yet</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{turnoutPct}%</div>
            <div className="text-xs text-white/60 mt-0.5">Turnout</div>
          </div>
        </div>
        {confirmed.length > 0 && (
          <div className="mt-4">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${turnoutPct}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Election Day Automation Schedule
          </h2>
          <div className="space-y-3">
            {SCHEDULE.map((item, i) => (
              <div key={i} className={cn("flex gap-3 p-3 rounded-lg border", item.done ? "border-green-200 bg-green-50/60" : "border-border bg-muted/20")}>
                <div className={cn("w-1 rounded-full flex-shrink-0", item.done ? "bg-green-500" : "bg-muted-foreground/30")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={cn("text-sm font-bold", item.done ? "text-green-700" : "text-foreground")}>{item.time}</span>
                    {item.done && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 italic">{item.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ward turnout */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Ward Support Intelligence</h2>
            <div className="space-y-2">
              {wards?.map(ward => (
                <div key={ward.ward} className={cn("border rounded-lg p-3", ZONE_COLORS[ward.zone] || "border-border bg-muted/20")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-semibold", ZONE_TEXT[ward.zone] || "text-foreground")}>{ward.ward}</span>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-sm font-bold", ZONE_TEXT[ward.zone] || "text-foreground")}>{ward.supportPercent}%</span>
                      <span className="text-xs text-muted-foreground ml-2">support</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ward.confirmed} confirmed, {ward.leaning} leaning of {ward.total} total
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Not voted list */}
          {notVoted.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Confirmed Supporters Not Yet Voted
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notVoted.slice(0, 10).map(v => (
                  <div key={v.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{v.fullName}</div>
                      <div className="text-xs text-muted-foreground">{v.ward} — {v.pollingStation}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex-shrink-0 border-green-300 text-green-700 hover:bg-green-50"
                      disabled={markingId === v.id}
                      onClick={() => markVoted(v.id)}
                    >
                      {markingId === v.id ? "..." : "Mark Voted"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
