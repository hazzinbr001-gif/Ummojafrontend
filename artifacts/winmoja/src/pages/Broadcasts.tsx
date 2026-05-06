import { useState } from "react";
import { useListBroadcasts, useCreateBroadcast, useDeleteBroadcast, getListBroadcastsQueryKey, useSmsBroadcasts, useSendSmsBroadcast, useSmsRecipientsCount } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCampaignConfig } from "@/context/CampaignConfigContext";
import { Plus, Radio, Trash2, AlertTriangle, Megaphone, Bell, CalendarDays, MessageSquare, Smartphone, CheckCircle2, XCircle, Clock, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  text: { label: "Update", color: "bg-slate-100 text-slate-700 border-slate-200", icon: MessageSquare },
  announcement: { label: "Announcement", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Megaphone },
  alert: { label: "Alert", color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
  rally: { label: "Rally", color: "bg-green-100 text-green-800 border-green-200", icon: CalendarDays },
  update: { label: "Update", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Bell },
};

const broadcastSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(["text", "announcement", "alert", "rally", "update"]),
});
type BroadcastForm = z.infer<typeof broadcastSchema>;

const smsSchema = z.object({
  message: z.string().min(1).max(918),
  ward: z.string().optional(),
});
type SmsForm = z.infer<typeof smsSchema>;

const SMS_LIMIT = 160;

function SmsStatusBadge({ status }: { status: string }) {
  if (status === "completed") return <span className="flex items-center gap-1 text-xs text-green-700 font-medium"><CheckCircle2 className="w-3 h-3" />Sent</span>;
  if (status === "sending") return <span className="flex items-center gap-1 text-xs text-blue-700 font-medium"><Clock className="w-3 h-3" />Sending…</span>;
  if (status === "failed") return <span className="flex items-center gap-1 text-xs text-red-700 font-medium"><XCircle className="w-3 h-3" />Failed</span>;
  return <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium"><Clock className="w-3 h-3" />Pending</span>;
}

function SmsBroadcastDialog({ wards }: { wards: string[] }) {
  const [open, setOpen] = useState(false);
  const [ward, setWard] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const sendSms = useSendSmsBroadcast();
  const { data: countData } = useSmsRecipientsCount(ward);

  const form = useForm<SmsForm>({ resolver: zodResolver(smsSchema), defaultValues: { message: "" } });
  const msg = form.watch("message") || "";
  const smsCount = Math.ceil(msg.length / SMS_LIMIT) || 1;
  const charsLeft = smsCount * SMS_LIMIT - msg.length;

  const onSubmit = (values: SmsForm) => {
    sendSms.mutate({ ...values, ward: ward && ward !== "all" ? ward : undefined }, {
      onSuccess: () => {
        toast({ title: "SMS blast queued", description: `Sending to ${countData?.count ?? "?"} voters. Delivery updates in history.` });
        form.reset();
        setWard(undefined);
        setOpen(false);
      },
      onError: (err) => toast({ title: "SMS failed", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-green-600 text-green-700 hover:bg-green-50">
          <Smartphone className="w-4 h-4" />SMS Blast
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-green-600" />Send SMS to Voters</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1">
            <Label>Target Ward</Label>
            <Select value={ward ?? "all"} onValueChange={v => { setWard(v === "all" ? undefined : v); }}>
              <SelectTrigger><SelectValue placeholder="All wards" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wards</SelectItem>
                {wards.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {countData ? `${countData.count.toLocaleString()} voters with phone numbers` : "Loading count…"}
            </p>
          </div>

          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea
              {...form.register("message")}
              placeholder="Type your SMS message here…"
              rows={5}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{msg.length} characters · {smsCount} SMS {smsCount > 1 ? "parts" : "part"}</span>
              <span className={charsLeft < 20 ? "text-amber-600 font-medium" : ""}>{charsLeft} left</span>
            </div>
            {form.formState.errors.message && <p className="text-xs text-red-600">{form.formState.errors.message.message}</p>}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            This will send a real SMS to <strong>{countData?.count?.toLocaleString() ?? "?"} voters</strong>
            {ward && ward !== "all" ? ` in ${ward}` : " across all wards"}. Standard messaging costs apply via Africa's Talking.
          </div>

          <Button type="submit" className="w-full gap-2 bg-green-700 hover:bg-green-800" disabled={sendSms.isPending || !msg.trim()}>
            <Send className="w-4 h-4" />
            {sendSms.isPending ? "Sending…" : `Send SMS to ${countData?.count?.toLocaleString() ?? "?"} voters`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Broadcasts() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  const { config } = useCampaignConfig();
  const wards: string[] = config?.wards ? JSON.parse(config.wards) : [];

  const params = { page: 1, limit: 20 };
  const { data, isLoading } = useListBroadcasts(params, { query: { queryKey: getListBroadcastsQueryKey(params) } });
  const createBroadcast = useCreateBroadcast();
  const deleteBroadcast = useDeleteBroadcast();
  const { data: smsHistory, isLoading: smsLoading } = useSmsBroadcasts();

  const form = useForm<BroadcastForm>({ resolver: zodResolver(broadcastSchema), defaultValues: { type: "announcement" } });

  const onSubmit = (values: BroadcastForm) => {
    createBroadcast.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Broadcast published" });
        qc.invalidateQueries({ queryKey: getListBroadcastsQueryKey() });
        form.reset();
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to publish broadcast", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaign Broadcasts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Publish updates and send SMS blasts to all voters</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SmsBroadcastDialog wards={wards} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />New Broadcast</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Publish New Broadcast</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-1"><Label>Type</Label>
                  <Select defaultValue="announcement" onValueChange={v => form.setValue("type", v as BroadcastForm["type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Title</Label><Input {...form.register("title")} placeholder="Broadcast title" /></div>
                <div className="space-y-1"><Label>Message</Label><Textarea {...form.register("content")} placeholder="Write your message to supporters…" rows={5} /></div>
                <Button type="submit" className="w-full" disabled={createBroadcast.isPending}>{createBroadcast.isPending ? "Publishing…" : "Publish Broadcast"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="broadcasts">
        <TabsList>
          <TabsTrigger value="broadcasts" className="gap-2"><Radio className="w-4 h-4" />Channel</TabsTrigger>
          <TabsTrigger value="sms" className="gap-2"><Smartphone className="w-4 h-4" />SMS History</TabsTrigger>
        </TabsList>

        {/* ── Channel broadcasts ── */}
        <TabsContent value="broadcasts" className="space-y-4 pt-4">
          {isLoading ? [...Array(4)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-32 animate-pulse" />) :
            data?.data.map((broadcast) => {
              const config = TYPE_CONFIG[broadcast.type] || TYPE_CONFIG.text;
              const Icon = config.icon;
              return (
                <div key={broadcast.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-foreground">{broadcast.title}</h3>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium", config.color)}>{config.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{broadcast.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{broadcast.authorName}</span>
                          <span>•</span>
                          <span>{new Date(broadcast.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteBroadcast.mutate({ id: broadcast.id }, { onSuccess: () => { toast({ title: "Deleted" }); qc.invalidateQueries({ queryKey: getListBroadcastsQueryKey() }); } })} className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          {!isLoading && (!data?.data || data.data.length === 0) && (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">No broadcasts yet</p>
            </div>
          )}
        </TabsContent>

        {/* ── SMS history ── */}
        <TabsContent value="sms" className="space-y-4 pt-4">
          {smsLoading ? [...Array(3)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse" />) :
            smsHistory?.map(sms => (
              <div key={sms.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-4 h-4 text-green-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm text-foreground">{sms.ward ?? "All wards"}</span>
                        <SmsStatusBadge status={sms.status} />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{sms.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{sms.totalRecipients.toLocaleString()} recipients</span>
                        {sms.status === "completed" && (
                          <>
                            <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3 h-3" />{sms.delivered.toLocaleString()} delivered</span>
                            {sms.failed > 0 && <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3 h-3" />{sms.failed.toLocaleString()} failed</span>}
                          </>
                        )}
                        <span>•</span>
                        <span>{sms.sentByName}</span>
                        <span>•</span>
                        <span>{new Date(sms.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {!smsLoading && (!smsHistory || smsHistory.length === 0) && (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">No SMS blasts sent yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "SMS Blast" to send your first message to voters</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
