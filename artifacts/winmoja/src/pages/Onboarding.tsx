import { useState } from "react";
import { Shield, ChevronRight, ChevronLeft, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = ["Campaign Info", "Wards", "Admin Account", "Review"];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    candidateName: "",
    constituency: "",
    county: "",
    electionYear: new Date().getFullYear() + 1,
    partyName: "",
    wards: [""],
    adminUsername: "",
    adminPassword: "",
    adminConfirm: "",
    adminFullName: "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addWard = () => setForm(f => ({ ...f, wards: [...f.wards, ""] }));
  const removeWard = (i: number) => setForm(f => ({ ...f, wards: f.wards.filter((_, idx) => idx !== i) }));
  const setWard = (i: number, v: string) => setForm(f => ({ ...f, wards: f.wards.map((w, idx) => idx === i ? v : w) }));

  const canNext = () => {
    if (step === 0) return form.candidateName && form.constituency && form.county && form.electionYear;
    if (step === 1) return form.wards.filter(w => w.trim()).length > 0;
    if (step === 2) return form.adminUsername && form.adminPassword.length >= 6 && form.adminPassword === form.adminConfirm && form.adminFullName;
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    const wards = form.wards.filter(w => w.trim());
    try {
      const res = await fetch("/api/config/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: form.candidateName,
          constituency: form.constituency,
          county: form.county,
          electionYear: Number(form.electionYear),
          wards,
          partyName: form.partyName || undefined,
          adminUsername: form.adminUsername,
          adminPassword: form.adminPassword,
          adminFullName: form.adminFullName,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Setup failed");
      }
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,7%)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome to WinMoja</h1>
          <p className="text-white/40 text-sm mt-1">Set up your campaign platform</p>
        </div>

        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white ring-2 ring-primary/30" : "bg-white/10 text-white/40"}`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i === step ? "text-white" : "text-white/40"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-6 h-px mx-1 ${i < step ? "bg-primary" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[hsl(222,47%,11%)] border border-[hsl(222,47%,18%)] rounded-2xl p-6 shadow-2xl">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-white mb-4">Campaign Information</h2>
              <div className="space-y-1">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Candidate Full Name</Label>
                <Input value={form.candidateName} onChange={e => set("candidateName", e.target.value)} placeholder="e.g. Hon. Jane Wanjiku Kamau" className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Constituency</Label>
                  <Input value={form.constituency} onChange={e => set("constituency", e.target.value)} placeholder="e.g. Kibra" className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25" />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">County</Label>
                  <Input value={form.county} onChange={e => set("county", e.target.value)} placeholder="e.g. Nairobi" className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Election Year</Label>
                  <Input type="number" value={form.electionYear} onChange={e => set("electionYear", e.target.value)} className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Party (Optional)</Label>
                  <Input value={form.partyName} onChange={e => set("partyName", e.target.value)} placeholder="e.g. Jubilee" className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-white mb-4">Electoral Wards</h2>
              <p className="text-white/50 text-sm">Enter all the wards in your constituency.</p>
              <div className="space-y-2">
                {form.wards.map((ward, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={ward} onChange={e => setWard(i, e.target.value)} placeholder={`Ward ${i + 1} name`} className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25" />
                    {form.wards.length > 1 && (
                      <button onClick={() => removeWard(i)} className="text-white/40 hover:text-red-400 transition-colors p-2"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addWard} className="gap-2 border-[hsl(222,47%,22%)] text-white/70 hover:text-white hover:bg-white/10">
                <Plus className="w-4 h-4" />Add Ward
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-white mb-4">Admin Account</h2>
              <p className="text-white/50 text-sm">This account will have full access to the platform.</p>
              <div className="space-y-1">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Full Name</Label>
                <Input value={form.adminFullName} onChange={e => set("adminFullName", e.target.value)} placeholder="Admin's full name" className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25" />
              </div>
              <div className="space-y-1">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Username</Label>
                <Input value={form.adminUsername} onChange={e => set("adminUsername", e.target.value)} placeholder="e.g. admin" className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Password</Label>
                  <Input type="password" value={form.adminPassword} onChange={e => set("adminPassword", e.target.value)} placeholder="Min 6 characters" className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25" />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Confirm Password</Label>
                  <Input type="password" value={form.adminConfirm} onChange={e => set("adminConfirm", e.target.value)} placeholder="Repeat password" className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25" />
                </div>
              </div>
              {form.adminPassword && form.adminConfirm && form.adminPassword !== form.adminConfirm && (
                <p className="text-red-400 text-xs">Passwords do not match</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-white mb-4">Review & Confirm</h2>
              <div className="space-y-3">
                {[
                  { label: "Candidate", value: form.candidateName },
                  { label: "Constituency", value: form.constituency },
                  { label: "County", value: form.county },
                  { label: "Election Year", value: String(form.electionYear) },
                  { label: "Party", value: form.partyName || "Independent" },
                  { label: "Wards", value: form.wards.filter(w => w.trim()).join(", ") },
                  { label: "Admin User", value: `${form.adminFullName} (@${form.adminUsername})` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 py-2 border-b border-[hsl(222,47%,18%)]">
                    <span className="text-white/50 text-sm">{label}</span>
                    <span className="text-white text-sm font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-[hsl(222,47%,18%)]">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="text-white/60 hover:text-white gap-1">
              <ChevronLeft className="w-4 h-4" />Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gap-1">
                Next<ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="gap-1">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Setting up...</> : <><Check className="w-4 h-4" />Launch Campaign</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
