import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shield, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,7%)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">WinMoja</h1>
          <p className="text-white/40 text-sm mt-1">Campaign Command Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[hsl(222,47%,11%)] border border-[hsl(222,47%,18%)] rounded-2xl p-6 shadow-2xl">
          <div className="mb-5">
            <div className="text-white/60 text-xs uppercase tracking-widest font-medium mb-0.5">Candidate</div>
            <div className="text-white font-semibold">Dr. Joseph Mogendi Birundu</div>
            <div className="text-primary text-sm">Nyaribari Chache • 2027</div>
          </div>

          <div className="h-px bg-[hsl(222,47%,18%)] mb-5" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wider">Username</Label>
              <Input
                data-testid="input-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,22%)] text-white placeholder:text-white/25 focus:border-primary focus:ring-primary/20 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                data-testid="text-login-error"
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </div>
            )}

            <Button
              data-testid="button-login"
              type="submit"
              className="w-full gap-2 h-11 text-base font-semibold"
              disabled={loading || !username || !password}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6 uppercase tracking-widest">
          Strictly Confidential — Authorized Access Only
        </p>
      </div>
    </div>
  );
}
