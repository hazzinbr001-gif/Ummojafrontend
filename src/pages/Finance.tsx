import { useState } from "react";
import { useListTransactions, useCreateTransaction, useGetFinanceSummary, getListTransactionsQueryKey, getGetFinanceSummaryQueryKey, ListTransactionsType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, DollarSign, Lock } from "lucide-react";
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

const transactionSchema = z.object({
  type: z.enum(["income", "expenditure"]),
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  source: z.string().optional(),
});
type TxForm = z.infer<typeof transactionSchema>;

const INCOME_CATEGORIES = ["Donations", "Pledges", "Personal Funds", "Business Group", "Diaspora Fund", "Ward Leaders", "Other"];
const EXPENDITURE_CATEGORIES = ["Printing", "Transport", "Rallies", "Airtime Rewards", "Food & Relief", "Technology", "Salaries", "Other"];

export default function Finance() {
  const [type, setType] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = { page: 1, limit: 50, ...(type && { type: type as ListTransactionsType }) };
  const { data, isLoading } = useListTransactions(params, { query: { queryKey: getListTransactionsQueryKey(params) } });
  const { data: summary } = useGetFinanceSummary({ query: { queryKey: getGetFinanceSummaryQueryKey() } });
  const createTransaction = useCreateTransaction();

  const form = useForm<TxForm>({ resolver: zodResolver(transactionSchema), defaultValues: { type: "income" } });
  const watchedType = form.watch("type");

  const onSubmit = (values: TxForm) => {
    createTransaction.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Transaction recorded" });
        qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
        form.reset({ type: "income" });
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to record transaction", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Campaign Finance</h1>
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">Private — authorized team only</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Log Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Transaction</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1"><Label>Type</Label>
                <Select defaultValue="income" onValueChange={v => { form.setValue("type", v as TxForm["type"]); form.setValue("category", ""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expenditure">Expenditure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Category</Label>
                <Select onValueChange={v => form.setValue("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(watchedType === "income" ? INCOME_CATEGORIES : EXPENDITURE_CATEGORIES).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Description</Label><Input {...form.register("description")} placeholder="Brief description" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Amount (KSh)</Label><Input {...form.register("amount")} type="number" placeholder="0" /></div>
                <div className="space-y-1"><Label>Source / Payee</Label><Input {...form.register("source")} placeholder="Optional" /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
                {createTransaction.isPending ? "Recording..." : "Record Transaction"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <div className="text-xl font-bold text-green-800">KSh {summary.totalIncome.toLocaleString()}</div>
              <div className="text-sm text-green-700">Total Income</div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <div className="text-xl font-bold text-red-800">KSh {summary.totalExpenditure.toLocaleString()}</div>
              <div className="text-sm text-red-700">Total Expenditure</div>
            </div>
          </div>
          <div className={cn("border rounded-xl p-4 flex items-center gap-4",
            summary.balance >= 0 ? "bg-primary/10 border-primary/30" : "bg-red-50 border-red-200"
          )}>
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
              summary.balance >= 0 ? "bg-primary/20" : "bg-red-100"
            )}>
              <DollarSign className={cn("w-5 h-5", summary.balance >= 0 ? "text-primary" : "text-red-700")} />
            </div>
            <div>
              <div className={cn("text-xl font-bold", summary.balance >= 0 ? "text-primary" : "text-red-800")}>
                KSh {Math.abs(summary.balance).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">{summary.balance >= 0 ? "Available Balance" : "Deficit"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <Button variant={type === "" ? "default" : "outline"} size="sm" onClick={() => setType("")}>All</Button>
        <Button variant={type === "income" ? "default" : "outline"} size="sm" onClick={() => setType("income")}>Income</Button>
        <Button variant={type === "expenditure" ? "default" : "outline"} size="sm" onClick={() => setType("expenditure")}>Expenditure</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Description</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Source</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
              )) : data?.data.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className={cn("flex items-center gap-1.5",
                      tx.type === "income" ? "text-green-700" : "text-red-600"
                    )}>
                      {tx.type === "income" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span className="text-xs font-medium capitalize">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{tx.category}</td>
                  <td className="px-4 py-3 text-foreground">{tx.description}</td>
                  <td className={cn("px-4 py-3 text-right font-bold",
                    tx.type === "income" ? "text-green-700" : "text-red-600"
                  )}>
                    {tx.type === "income" ? "+" : "-"}KSh {tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{tx.source || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                    {new Date(tx.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
