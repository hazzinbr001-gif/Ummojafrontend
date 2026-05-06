import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useCampaignConfig } from "@/context/CampaignConfigContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, FileText, Radio, Share2,
  UserCheck, DollarSign, BookOpen, Zap, Settings,
  LogOut, Shield, ChevronRight, Menu, X
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/voters", label: "Voters", icon: Users },
  { path: "/requests", label: "Requests", icon: FileText },
  { path: "/broadcasts", label: "Broadcasts", icon: Radio },
  { path: "/referrals", label: "Referrals", icon: Share2 },
  { path: "/volunteers", label: "Volunteers", icon: UserCheck },
  { path: "/finance", label: "Finance", icon: DollarSign },
  { path: "/manifesto", label: "Manifesto", icon: BookOpen },
  { path: "/election-day", label: "Election Day", icon: Zap },
  { path: "/users", label: "Users", icon: Settings, adminOnly: true },
];

function NavLink({ path, label, icon: Icon, active, onClick, adminOnly, userRole }: {
  path: string; label: string; icon: React.ElementType; active: boolean; onClick?: () => void; adminOnly?: boolean; userRole?: string;
}) {
  if (adminOnly && userRole !== "admin") return null;
  return (
    <Link href={path} onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer select-none",
        active
          ? "bg-primary text-white shadow-sm"
          : "text-white/60 hover:text-white hover:bg-white/8"
      )}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{label}</span>
        {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
      </div>
    </Link>
  );
}

function Sidebar({ location, onClose }: { location: string; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { config } = useCampaignConfig();

  return (
    <aside className="flex flex-col h-full bg-[hsl(222,47%,9%)] border-r border-[hsl(222,47%,16%)] w-64">
      <div className="px-4 py-5 border-b border-[hsl(222,47%,16%)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm leading-tight">WinMoja</div>
            <div className="text-xs text-white/40 truncate">Campaign Platform</div>
          </div>
        </div>

        {config?.setupComplete && (
          <div className="mt-4 px-2 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="text-xs text-primary font-semibold truncate">{config.candidateName}</div>
            <div className="text-xs text-white/40 truncate mt-0.5">{config.constituency}, {config.county}</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            {...item}
            active={item.path === "/" ? location === "/" : location.startsWith(item.path)}
            userRole={user?.role}
            onClick={onClose}
          />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-[hsl(222,47%,16%)]">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-bold">{user?.fullName?.[0]?.toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-white/90 truncate">{user?.fullName}</div>
            <div className="text-xs text-white/40 capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex flex-col h-full">
        <Sidebar location={location} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex flex-col h-full">
            <Sidebar location={location} onClose={() => setSidebarOpen(false)} />
          </div>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[hsl(222,47%,9%)] border-b border-[hsl(222,47%,16%)]">
          <button onClick={() => setSidebarOpen(true)} className="text-white/70 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-bold text-white text-sm">WinMoja</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
