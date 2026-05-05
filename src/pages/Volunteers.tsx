import { useState } from "react";
import { useListVolunteers, useCreateVolunteer, useUpdateVolunteer, getListVolunteersQueryKey, Volunteer } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<string, string> = {
  ward_coordinator: "Ward Coordinator", polling_agent: "Polling Agent",
  mobilizer: "Mobilizer", driver: "Driver", other: "Other",
};
const ROLE_COLORS: Record<string, string> = {
  ward_coordinator: "bg-purple-100 text-purple-800 border-purple-200",
  polling_agent: "bg-blue-100 text-blue-800 border-blue-200",
  mobilizer: "bg-green-100 text-green-800 border-green-200",
  driver: "bg-amber-100 text-amber-800 border-amber-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const WARDS = ["Kisii Central", "Bogiakumu", "Mwembe", "Kegati", "Nyabururu"];
const ROLES = ["ward_coordinator", "polling_agent", "mobilizer", "driver", "other"];

const volunteerSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  ward: z.string().min(1),
  role: z.enum(["ward_coordinator", "polling_agent", "mobilizer", "driver", "other"]),
  pollingStation: z.string().optional(),
  notes: z.string().optional(),
});
type VolunteerForm = z.infer<typeof volunteerSchema>;

export default function Volunteers() {
  const [ward, setWard] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = { page: 1, limit: 100, ...(ward && { ward }) };
  const { data, isLoading } = useListVolunteers(params, { query: { queryKey: getListVolunteersQueryKey(params) } });
  const createVolunteer = useCreateVolunteer();
  const updateVolunteer = useUpdateVolunteer();

  const form = useForm<VolunteerForm>({ resolver: zodResolver(volunteerSchema) });

  const onSubmit = (values: VolunteerForm) => {
    createVolunteer.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Volunteer registered" });
        qc.invalidateQueries({ queryKey: getListVolunteersQueryKey() });
        form.reset();
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to register volunteer", variant: "destructive" }),
    });
  };

  const toggleActive = (id: number, isActive: boolean) => {
    updateVolunteer.mutate({ id, data: { isActive: !isActive } }, {
      onSuccess: () => {
        toast({ title: isActive ? "Volunteer deactivated" : "Volunteer activated" });
        qc.invalidateQueries({ queryKey: getListVolunteersQueryKey() });
      },
    });
  };

  const grouped = WARDS.reduce<Record<string, Volunteer[]>>((acc, w) => {
    acc[w] = data?.data.filter((v: Volunteer) => v.ward === w) ?? [];
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Volunteers & Agents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.total || 0} registered across all wards</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="w-4 h-4" />Register Volunteer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Volunteer</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Full Name</Label><Input {...form.register("fullName")} placeholder="Full name" /></div>
                <div className="space-y-1"><Label>Phone</Label><Input {...form.register("phone")} placeholder="07XX..." /></div>
                <div className="space-y-1"><Label>Ward</Label>
                  <Select onValueChange={v => form.setValue("ward", v)}>
                    <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
                    <SelectContent>{WARDS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Role</Label>
                  <Select onValueChange={v => form.setValue("role", v as VolunteerForm["role"])}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Polling Station</Label><Input {...form.register("pollingStation")} placeholder="If applicable" /></div>
                <div className="col-span-2 space-y-1"><Label>Notes</Label><Input {...form.register("notes")} placeholder="Any notes..." /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createVolunteer.isPending}>
                {createVolunteer.isPending ? "Registering..." : "Register Volunteer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={ward === "" ? "default" : "outline"} size="sm" onClick={() => setWard("")}>All Wards</Button>
        {WARDS.map(w => (
          <Button key={w} variant={ward === w ? "default" : "outline"} size="sm" onClick={() => setWard(ward === w ? "" : w)}>
            {w} ({data?.data.filter(v => v.ward === w).length || 0})
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {(ward ? [ward] : WARDS).map(w => {
            const wardVolunteers = grouped[w] || [];
            if (wardVolunteers.length === 0) return null;
            return (
              <div key={w}>
                <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {w} Ward
                  <span className="text-sm text-muted-foreground font-normal">({wardVolunteers.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {wardVolunteers.map(v => (
                    <div key={v.id} className={cn("bg-card border border-border rounded-xl p-4 shadow-sm", !v.isActive && "opacity-60")}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="font-semibold text-sm text-foreground">{v.fullName}</div>
                          <div className="text-xs text-muted-foreground">{v.phone}</div>
                        </div>
                        <button onClick={() => toggleActive(v.id, v.isActive)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                          {v.isActive ? <UserCheck className="w-4 h-4 text-green-600" /> : <UserX className="w-4 h-4 text-red-500" />}
                        </button>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium", ROLE_COLORS[v.role] || "bg-gray-100 text-gray-600")}>
                        {ROLE_LABELS[v.role]}
                      </span>
                      {v.pollingStation && (
                        <div className="text-xs text-muted-foreground mt-2">{v.pollingStation}</div>
                      )}
                      {v.notes && <div className="text-xs text-muted-foreground mt-1 italic">{v.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
