import { useState, useRef } from "react";
import { useListVoters, useCreateVoter, useUpdateVoter, useImportVotersCsv, getListVotersQueryKey, ListVotersSupportLevel } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ChevronLeft, ChevronRight, UserPlus, Upload, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCampaignConfig } from "@/context/CampaignConfigContext";

const SUPPORT_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800 border-green-200",
  leaning: "bg-amber-100 text-amber-800 border-amber-200",
  undecided: "bg-slate-100 text-slate-700 border-slate-200",
  opposed: "bg-red-100 text-red-800 border-red-200",
  unknown: "bg-gray-100 text-gray-600 border-gray-200",
};
const SUPPORT_LEVELS = ["confirmed", "leaning", "undecided", "opposed", "unknown"];

const voterSchema = z.object({
  fullName: z.string().min(1),
  idNumber: z.string().min(1),
  ward: z.string().min(1),
  village: z.string().optional(),
  pollingStation: z.string().min(1),
  phone: z.string().optional(),
  supportLevel: z.enum(["confirmed", "leaning", "undecided", "opposed", "unknown"]).default("unknown"),
  notes: z.string().optional(),
});
type VoterForm = z.infer<typeof voterSchema>;

export default function Voters() {
  const [search, setSearch] = useState("");
  const [ward, setWard] = useState("");
  const [supportLevel, setSupportLevel] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  const { wards } = useCampaignConfig();

  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const params = { page, limit: 20, ...(search && { search }), ...(ward && { ward }), ...(supportLevel && { supportLevel: supportLevel as ListVotersSupportLevel }) };
  const { data, isLoading } = useListVoters(params, { query: { queryKey: getListVotersQueryKey(params) } });
  const createVoter = useCreateVoter();
  const importCsv = useImportVotersCsv();

  const form = useForm<VoterForm>({ resolver: zodResolver(voterSchema), defaultValues: { supportLevel: "unknown" } });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const csv = ev.target?.result as string;
      importCsv.mutate({ csv }, {
        onSuccess: (result) => {
          setImportResult(result);
          qc.invalidateQueries({ queryKey: getListVotersQueryKey() });
          toast({ title: `Imported ${result.imported} voter${result.imported !== 1 ? "s" : ""}${result.skipped > 0 ? `, ${result.skipped} skipped (duplicates)` : ""}` });
        },
        onError: (err) => toast({ title: err.message || "Import failed", variant: "destructive" }),
      });
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const csv = "fullName,idNumber,ward,pollingStation,phone,village,supportLevel\nJohn Doe,12345678,Ward A,Central Primary School,0712345678,Village X,confirmed";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "voters_template.csv";
    a.click();
  };

  const onSubmit = (values: VoterForm) => {
    createVoter.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Voter registered successfully" });
        qc.invalidateQueries({ queryKey: getListVotersQueryKey() });
        form.reset();
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to register voter", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleFileSelect} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Voter Intelligence Database</h1>
          <p className="text-muted-foreground text-sm mt-0.5">IEBC registered voters — {data?.total?.toLocaleString() ?? "—"} total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={downloadTemplate}><Download className="w-4 h-4" />CSV Template</Button>
          <Button variant="outline" size="sm" className="gap-2" disabled={importCsv.isPending} onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" />{importCsv.isPending ? "Importing..." : "Import CSV"}
          </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="w-4 h-4" />Add Voter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Voter</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Full Name</Label><Input {...form.register("fullName")} placeholder="Full legal name" /></div>
                <div className="space-y-1"><Label>ID Number</Label><Input {...form.register("idNumber")} placeholder="National ID" /></div>
                <div className="space-y-1"><Label>Phone</Label><Input {...form.register("phone")} placeholder="07XX..." /></div>
                <div className="space-y-1"><Label>Ward</Label>
                  <Select onValueChange={(v) => form.setValue("ward", v)}>
                    <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
                    <SelectContent>{wards.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Village</Label><Input {...form.register("village")} placeholder="Village name" /></div>
                <div className="col-span-2 space-y-1"><Label>Polling Station</Label><Input {...form.register("pollingStation")} placeholder="Polling station name" /></div>
                <div className="col-span-2 space-y-1"><Label>Support Level</Label>
                  <Select defaultValue="unknown" onValueChange={(v) => form.setValue("supportLevel", v as VoterForm["supportLevel"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SUPPORT_LEVELS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createVoter.isPending}>{createVoter.isPending ? "Registering..." : "Register Voter"}</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={ward} onValueChange={v => { setWard(v === "_all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All wards" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Wards</SelectItem>
            {wards.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={supportLevel} onValueChange={v => { setSupportLevel(v === "_all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All support levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Levels</SelectItem>
            {SUPPORT_LEVELS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">ID Number</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ward</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Polling Station</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Support</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Voted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? [...Array(10)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
              )) : data?.data.map((voter) => (
                <tr key={voter.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{voter.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell font-mono text-xs">{voter.idNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{voter.ward}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{voter.pollingStation}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium capitalize", SUPPORT_COLORS[voter.supportLevel] || "bg-gray-100 text-gray-600")}>
                      {voter.supportLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{voter.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium", voter.hasVoted ? "text-green-700" : "text-muted-foreground")}>{voter.hasVoted ? "Voted" : "Not yet"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">{data.total} voter{data.total !== 1 ? "s" : ""} total</span>
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
