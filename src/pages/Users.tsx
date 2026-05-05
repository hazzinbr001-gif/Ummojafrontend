import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus, Pencil, Trash2, ShieldCheck, Eye, Users as UsersIcon,
  ToggleLeft, ToggleRight, KeyRound, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const WARDS = ["Kisii Central", "Bogiakumu", "Mwembe", "Kegati", "Nyabururu"];
const ROLES = ["admin", "coordinator", "viewer"] as const;
type Role = typeof ROLES[number];

interface AppUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  ward: string | null;
  isActive: boolean;
  createdAt: string;
}

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-primary/20 text-primary border border-primary/30",
  coordinator: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  viewer: "bg-white/10 text-white/50 border border-white/10",
};

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  admin: <ShieldCheck className="w-3 h-3" />,
  coordinator: <UsersIcon className="w-3 h-3" />,
  viewer: <Eye className="w-3 h-3" />,
};

function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
}

function UserFormModal({
  user,
  onClose,
}: {
  user?: AppUser;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!user;

  const [form, setForm] = useState({
    username: user?.username ?? "",
    fullName: user?.fullName ?? "",
    role: user?.role ?? "viewer" as Role,
    ward: user?.ward ?? "",
    password: "",
    confirmPassword: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isEdit && form.password !== form.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (!isEdit && form.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const body: Record<string, any> = {
        fullName: form.fullName,
        role: form.role,
        ward: form.ward || null,
      };

      if (!isEdit) {
        body.username = form.username;
        body.password = form.password;
      } else if (form.password) {
        if (form.password !== form.confirmPassword) throw new Error("Passwords do not match");
        body.password = form.password;
      }

      const res = await apiFetch(
        isEdit ? `/api/users/${user!.id}` : "/api/users",
        { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(body) }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Request failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: isEdit ? "User updated" : "User created" });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{isEdit ? "Edit User" : "Add New User"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Username</label>
              <input
                value={form.username}
                onChange={e => set("username", e.target.value)}
                placeholder="e.g. jdoe"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Full Name</label>
            <input
              value={form.fullName}
              onChange={e => set("fullName", e.target.value)}
              placeholder="Full name"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Role</label>
              <select
                value={form.role}
                onChange={e => set("role", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Ward</label>
              <select
                value={form.ward}
                onChange={e => set("ward", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">All wards</option>
                {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
              {isEdit ? "New Password (leave blank to keep)" : "Password"}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="password"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                placeholder={isEdit ? "••••••••" : "Min 6 characters"}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {(form.password || !isEdit) && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => set("confirmPassword", e.target.value)}
                placeholder="Repeat password"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; user?: AppUser }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<AppUser | null>(null);

  const { data: users = [], isLoading } = useQuery<AppUser[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiFetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (u: AppUser) => {
      const res = await apiFetch(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (u: AppUser) => {
      const res = await apiFetch(`/api/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete user");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User deleted" });
      setDeleteConfirm(null);
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {modal.open && (
        <UserFormModal user={modal.user} onClose={() => setModal({ open: false })} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm mx-4 shadow-2xl p-6">
            <h3 className="font-semibold text-foreground mb-2">Delete User</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to permanently delete <span className="text-foreground font-medium">{deleteConfirm.fullName}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground">Cancel</button>
              <button
                onClick={() => deleteUser.mutate(deleteConfirm)}
                disabled={deleteUser.isPending}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleteUser.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage platform access and roles</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Users", value: users.length, color: "text-foreground" },
          { label: "Active", value: users.filter(u => u.isActive).length, color: "text-primary" },
          { label: "Inactive", value: users.filter(u => !u.isActive).length, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/50">
                {["User", "Role", "Ward", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className={cn("transition-colors hover:bg-background/50", !u.isActive && "opacity-50")}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground text-sm">{u.fullName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">@{u.username}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", ROLE_STYLES[u.role])}>
                      {ROLE_ICONS[u.role]}
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {u.ward ?? <span className="text-muted-foreground/40 italic">All wards</span>}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive.mutate(u)}
                      disabled={u.id === currentUser?.id}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium transition-colors",
                        u.isActive ? "text-primary hover:text-primary/70" : "text-muted-foreground hover:text-foreground",
                        u.id === currentUser?.id && "cursor-not-allowed opacity-50"
                      )}
                      title={u.id === currentUser?.id ? "Cannot change your own status" : u.isActive ? "Click to deactivate" : "Click to activate"}
                    >
                      {u.isActive
                        ? <ToggleRight className="w-4 h-4" />
                        : <ToggleLeft className="w-4 h-4" />}
                      {u.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal({ open: true, user: u })}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        title="Edit user"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(u)}
                        disabled={u.id === currentUser?.id}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          u.id === currentUser?.id
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        )}
                        title={u.id === currentUser?.id ? "Cannot delete your own account" : "Delete user"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
