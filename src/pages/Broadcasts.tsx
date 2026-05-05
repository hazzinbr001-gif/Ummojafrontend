import { useState } from "react";
import { useListBroadcasts, useCreateBroadcast, useDeleteBroadcast, getListBroadcastsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Radio, Trash2, AlertTriangle, Megaphone, Bell, CalendarDays, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function Broadcasts() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = { page: 1, limit: 20 };
  const { data, isLoading } = useListBroadcasts(params, { query: { queryKey: getListBroadcastsQueryKey(params) } });
  const createBroadcast = useCreateBroadcast();
  const deleteBroadcast = useDeleteBroadcast();

  const form = useForm<BroadcastForm>({ resolver: zodResolver(broadcastSchema), defaultValues: { type: "announcement" } });

  const onSubmit = (values: BroadcastForm) => {
    createBroadcast.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Broadcast published", description: "Supporters will be notified." });
        qc.invalidateQueries({ queryKey: getListBroadcastsQueryKey() });
        form.reset();
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to publish broadcast", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteBroadcast.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Broadcast deleted" });
        qc.invalidateQueries({ queryKey: getListBroadcastsQueryKey() });
      },
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaign Broadcasts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your private broadcast channel to all supporters</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />New Broadcast</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Publish New Broadcast</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1"><Label>Type</Label>
                <Select defaultValue="announcement" onValueChange={v => form.setValue("type", v as BroadcastForm["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Title</Label><Input {...form.register("title")} placeholder="Broadcast title" /></div>
              <div className="space-y-1"><Label>Message</Label><Textarea {...form.register("content")} placeholder="Write your message to supporters..." rows={5} /></div>
              <Button type="submit" className="w-full" disabled={createBroadcast.isPending}>
                {createBroadcast.isPending ? "Publishing..." : "Publish Broadcast"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? [...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 h-32 animate-pulse" />
        )) : data?.data.map((broadcast) => {
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
                      <span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium", config.color)}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{broadcast.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{broadcast.authorName}</span>
                      <span>•</span>
                      <span>{new Date(broadcast.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(broadcast.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0"
                >
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
            <p className="text-sm text-muted-foreground mt-1">Publish your first message to reach all supporters</p>
          </div>
        )}
      </div>
    </div>
  );
}
