import { useState } from "react";
import { useListRequests, useCreateRequest, useUpdateRequest, useGetRequestStats, getListRequestsQueryKey, getGetRequestStatsQueryKey, ListRequestsStatus, UpdateRequestBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
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

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-800 border-blue-200",
  under_review: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  fulfilled: "bg-purple-100 text-purple-800 border-purple-200",
};
const STATUS_LABELS: Record<string, string> = { received: "Received", under_review: "Under Review", approved: "Approved", declined: "Declined", fulfilled: "Fulfilled" };
const CATEGORIES = ["bursary", "medical", "business", "school_fees", "other"];
const STATUSES = ["received", "under_review", "approved", "declined", "fulfilled"];

const requestSchema = z.object({
  fullName: z.string().min(1),
  idNumber: z.string().min(1),
  phone: z.string().optional(),
  category: z.enum(["bursary", "medical", "business", "school_fees", "other"]),
  description: z.string().min(1),
  ward: z.string().optional(),
});
type RequestForm = z.infer<typeof requestSchema>;

export default function Requests() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = { page, limit: 20, ...(search && { search }), ...(status && { status: status as ListRequestsStatus }) };
  const { data, isLoading } = useListRequests(params, { query: { queryKey: getListRequestsQueryKey(params) } });
  const { data: stats } = useGetRequestStats({ query: { queryKey: getGetRequestStatsQueryKey() } });
  const createRequest = useCreateRequest();
  const updateRequest = useUpdateRequest();

  const form = useForm<RequestForm>({ resolver: zodResolver(requestSchema) });

  const onSubmit = (values: RequestForm) => {
    createRequest.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Request submitted" });
        qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetRequestStatsQueryKey() });
        form.reset();
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to submit request", variant: "destructive" }),
    });
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    updateRequest.mutate({ id, data: { status: newStatus as UpdateRequestBodyStatus } }, {
      onSuccess: () => {
        toast({ title: "Status updated" });
        qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetRequestStatsQueryKey() });
      },
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Constituent Requests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track bursaries, medical, business, and other requests</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />New Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Constituent Request</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Full Name</Label><Input {...form.register("fullName")} placeholder="Constituent full name" /></div>
                <div className="space-y-1"><Label>ID Number</Label><Input {...form.register("idNumber")} placeholder="National ID" /></div>
                <div className="space-y-1"><Label>Phone</Label><Input {...form.register("phone")} placeholder="07XX..." /></div>
                <div className="space-y-1"><Label>Category</Label>
                  <Select onValueChange={(v) => form.setValue("category", v as RequestForm["category"])}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ").replace(/^\w/, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Ward</Label><Input {...form.register("ward")} placeholder="Ward name" /></div>
                <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea {...form.register("description")} placeholder="Describe the request in detail..." rows={3} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createRequest.isPending}>{createRequest.isPending ? "Submitting..." : "Submit Request"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATUSES.map(s => (
            <div key={s} className="bg-card border border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatus(status === s ? "" : s)}>
              <div className={cn("text-xl font-bold", status === s ? "text-primary" : "text-foreground")}>{stats.byStatus[s] || 0}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{STATUS_LABELS[s]}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v === "_all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Reference</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Ward</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
              )) : data?.data.map((req) => (
                <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{req.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{req.fullName}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="capitalize text-muted-foreground">{req.category.replace("_", " ")}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{req.ward || "—"}</td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium", STATUS_COLORS[req.status] || "bg-gray-100 text-gray-600")}>{STATUS_LABELS[req.status]}</span></td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{new Date(req.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}</td>
                  <td className="px-4 py-3">
                    <Select value={req.status} onValueChange={v => handleStatusChange(req.id, v)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">{data.total} request{data.total !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm text-foreground">Page {page} of {Math.ceil(data.total / 20) || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
