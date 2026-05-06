import { useState } from "react";
import { useListManifestoItems, useCreateManifestoItem, useUpdateManifestoItem, getListManifestoItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, GraduationCap, Heart, Car, Droplets, Users, Shield, Wheat, Briefcase, CheckCircle, Circle, Clock } from "lucide-react";
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

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  education: { label: "Education", icon: GraduationCap, color: "text-blue-600 bg-blue-50 border-blue-200" },
  health: { label: "Health", icon: Heart, color: "text-red-600 bg-red-50 border-red-200" },
  roads: { label: "Roads & Infrastructure", icon: Car, color: "text-gray-700 bg-gray-50 border-gray-200" },
  water: { label: "Water & Sanitation", icon: Droplets, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  youth: { label: "Youth & Employment", icon: Users, color: "text-purple-600 bg-purple-50 border-purple-200" },
  security: { label: "Security", icon: Shield, color: "text-orange-600 bg-orange-50 border-orange-200" },
  agriculture: { label: "Agriculture", icon: Wheat, color: "text-green-600 bg-green-50 border-green-200" },
  economy: { label: "Economy & Governance", icon: Briefcase, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
};
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pledge: { label: "Pledge", icon: Circle, color: "text-slate-500 bg-slate-100 border-slate-200" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-amber-700 bg-amber-100 border-amber-200" },
  fulfilled: { label: "Fulfilled", icon: CheckCircle, color: "text-green-700 bg-green-100 border-green-200" },
};
const CATEGORIES = Object.keys(CATEGORY_CONFIG);

const manifestoSchema = z.object({
  category: z.enum(["education", "health", "roads", "water", "youth", "security", "agriculture", "economy"]),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.coerce.number().int().min(1).optional().default(1),
});
type ManifestoForm = z.infer<typeof manifestoSchema>;

export default function Manifesto() {
  const [selectedCat, setSelectedCat] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = selectedCat ? { category: selectedCat } : {};
  const { data: items, isLoading } = useListManifestoItems(params, { query: { queryKey: getListManifestoItemsQueryKey(params) } });
  const createItem = useCreateManifestoItem();
  const updateItem = useUpdateManifestoItem();
  const form = useForm<ManifestoForm>({ resolver: zodResolver(manifestoSchema) });

  const onSubmit = (values: ManifestoForm) => {
    createItem.mutate({ data: values }, {
      onSuccess: () => { toast({ title: "Policy added to manifesto" }); qc.invalidateQueries({ queryKey: getListManifestoItemsQueryKey() }); form.reset(); setOpen(false); },
      onError: () => toast({ title: "Failed to add policy", variant: "destructive" }),
    });
  };

  const handleStatusChange = (id: number, status: string) => {
    updateItem.mutate({ id, data: { status: status as "pledge" | "in_progress" | "fulfilled" } }, {
      onSuccess: () => { toast({ title: "Status updated" }); qc.invalidateQueries({ queryKey: getListManifestoItemsQueryKey() }); },
    });
  };

  const grouped = CATEGORIES.reduce<Record<string, NonNullable<typeof items>>>((acc, cat) => {
    acc[cat] = items?.filter(i => i.category === cat) ?? [];
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manifesto & Policy Engine</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Campaign promises — track fulfillment after election</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />Add Policy</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Manifesto Item</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1"><Label>Category</Label>
                <Select onValueChange={v => form.setValue("category", v as ManifestoForm["category"])}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Policy Title</Label><Input {...form.register("title")} placeholder="e.g. Universal Secondary Bursary" /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea {...form.register("description")} placeholder="Describe the pledge in plain language..." rows={4} /></div>
              <Button type="submit" className="w-full" disabled={createItem.isPending}>{createItem.isPending ? "Adding..." : "Add to Manifesto"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={selectedCat === "" ? "default" : "outline"} size="sm" onClick={() => setSelectedCat("")}>All</Button>
        {CATEGORIES.map(c => (
          <Button key={c} variant={selectedCat === c ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(selectedCat === c ? "" : c)}>{CATEGORY_CONFIG[c].label}</Button>
        ))}
      </div>

      {isLoading ? <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-8">
          {(selectedCat ? [selectedCat] : CATEGORIES).map(cat => {
            const catItems = grouped[cat];
            if (!catItems || catItems.length === 0) return null;
            const conf = CATEGORY_CONFIG[cat];
            const Icon = conf.icon;
            return (
              <div key={cat}>
                <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3", conf.color)}>
                  <Icon className="w-4 h-4" /><span className="font-semibold text-sm">{conf.label}</span>
                </div>
                <div className="space-y-3">
                  {catItems.map(item => {
                    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.pledge;
                    const StatusIcon = statusConf.icon;
                    return (
                      <div key={item.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                          </div>
                          <Select value={item.status} onValueChange={v => handleStatusChange(item.id, v)}>
                            <SelectTrigger className="h-7 w-36 text-xs flex-shrink-0">
                              <StatusIcon className={cn("w-3 h-3 mr-1", item.status === "fulfilled" ? "text-green-600" : item.status === "in_progress" ? "text-amber-600" : "text-slate-500")} />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>{Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
