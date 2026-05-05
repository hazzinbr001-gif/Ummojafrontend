import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, FileText, Radio, Share2,
  UserCheck, DollarSign, BookOpen, Zap, Menu, X, Shield, LogOut, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Command Center", adminOnly: false },
  { href: "/voters", icon: Users, label: "Voter Database", adminOnly: false },
  { href: "/requests", icon: FileText, label: "Constituent Requests", adminOnly: false },
  { href: "/broadcasts", icon: Radio, label: "Broadcasts", adminOnly: false },
  { href: "/referrals", icon: Share2, label: "Referral Engine", adminOnly: false },
  { href: "/volunteers", icon: UserCheck, label: "Volunteers & Agents", adminOnly: false },
  { href: "/finance", icon: DollarSign, label: "Finance Tracker", adminOnly: false },
  { href: "/manifesto", icon: BookOpen, label: "Manifesto", adminOnly: false },
  { href: "/election-day", icon: Zap, label: "Election Day", adminOnly: false },
  { href: "/users", icon: Settings, label: "User Management", adminOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { data: summary } = useGetDashboardSummary();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast({ title: "Failed to sign out", variant: "destructive" });
    }
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sidebar-foreground text-base leading-tight tracking-tight">WinMoja</div>
            <div className="text-xs text-sidebar-foreground/50 leading-tight">Campaign Platform</div>
          </div>
        </div>
        <div className="bg-sidebar-accent rounded-lg px-3 py-2">
          <div className="text-xs text-sidebar-foreground/60 mb-0.5 uppercase tracking-wider font-medium">Candidate</div>
          <div className="text-sm font-semibold text-sidebar-foreground leading-tight">Dr. Joseph Mogendi Birundu</div>
          <div className="text-xs text-primary mt-0.5">Nyaribari Chache • 2027</div>
        </div>
        {user?.ward && (
          <div className="mt-2 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            <div className="text-xs text-amber-400 font-medium truncate">
              {user.ward} Ward only
            </div>
          </div>
        )}
      </div>

      {summary && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-sidebar-accent rounded-md px-2 py-1.5 text-center">
              <div className="text-lg font-bold text-primary leading-none">{summary.confirmedSupporters.toLocaleString()}</div>
              <div className="text-[10px] text-sidebar-foreground/50 mt-0.5 uppercase tracking-wide">Confirmed</div>
            </div>
            <div className="bg-sidebar-accent rounded-md px-2 py-1.5 text-center">
              <div className="text-lg font-bold text-sidebar-foreground leading-none">{summary.totalVoters.toLocaleString()}</div>
              <div className="text-[10px] text-sidebar-foreground/50 mt-0.5 uppercase tracking-wide">Total Voters</div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.filter(item => !item.adminOnly || user?.role === "admin").map(({ href, icon: Icon, label, adminOnly }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                adminOnly && "mt-1 border-t border-sidebar-border pt-2"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border space-y-2">
        {user && (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-medium text-sidebar-foreground truncate">{user.fullName}</div>
              <div className="text-[10px] text-sidebar-foreground/40 capitalize">{user.role}</div>
            </div>
            <button
              data-testid="button-logout"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-sidebar-foreground/40 hover:text-red-400 transition-colors flex-shrink-0 px-2 py-1 rounded hover:bg-red-500/10"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
        <div className="text-[10px] text-sidebar-foreground/20 text-center uppercase tracking-widest">
          Strictly Confidential • 2027
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col flex-shrink-0 bg-sidebar border-r border-sidebar-border">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar flex flex-col">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="text-foreground/70">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-foreground">WinMoja</span>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
