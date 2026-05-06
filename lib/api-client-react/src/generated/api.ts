/**
 * WinMoja API Client — hand-written hooks matching the Express backend
 * Keeps the health-check export so existing imports don't break.
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { customFetch } from "../custom-fetch";
import type { HealthStatus } from "./api.schemas";

// ─── Health (kept from generated) ────────────────────────────────────────────

export const getHealthCheckUrl = () => `/api/healthz`;
export const healthCheck = (options?: RequestInit) =>
  customFetch<HealthStatus>(getHealthCheckUrl(), { ...options, method: "GET" });
export const getHealthCheckQueryKey = () => [`/api/healthz`] as const;
export function useHealthCheck() {
  return useQuery({ queryKey: getHealthCheckQueryKey(), queryFn: () => healthCheck() });
}
export type HealthCheckQueryResult = HealthStatus;
export type HealthCheckQueryError = unknown;

// ─── Shared helper ────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

function buildQuery(params: Record<string, any>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return q ? `?${q}` : "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Voter {
  id: number; fullName: string; idNumber: string; ward: string;
  village: string | null; pollingStation: string; phone: string | null;
  supportLevel: string; notes: string | null; hasVoted: boolean;
  lastContactedAt: string | null; createdAt: string;
}
export interface PaginatedVoters { data: Voter[]; total: number; page: number; limit: number; }
export interface WardSupport { ward: string; total: number; confirmed: number; leaning: number; undecided: number; opposed: number; supportPercent: number; zone: string; }
export interface DashboardSummary { totalVoters: number; confirmedSupporters: number; leaningSupporters: number; pendingRequests: number; totalVolunteers: number; totalReferrals: number; campaignBalance: number; broadcastsThisMonth: number; }
export interface ActivityLog { id: number; type: string; description: string; userId: number | null; createdAt: string; }
export interface ConstituentRequest { id: number; referenceNumber: string; fullName: string; idNumber: string; phone: string | null; category: string; description: string; status: string; ward: string | null; notes: string | null; createdAt: string; updatedAt: string; }
export interface PaginatedRequests { data: ConstituentRequest[]; total: number; page: number; limit: number; }
export interface RequestStats { byStatus: Record<string, number>; byCategory: Record<string, number>; total: number; }
export interface Broadcast { id: number; title: string; content: string; type: string; imageUrl: string | null; authorId: number; authorName: string; createdAt: string; }
export interface PaginatedBroadcasts { data: Broadcast[]; total: number; page: number; limit: number; }
export interface Referral { id: number; referrerName: string; referrerPhone: string; referredName: string | null; referredPhone: string | null; status: string; airtimeEarned: string; createdAt: string; }
export interface PaginatedReferrals { data: Referral[]; total: number; page: number; limit: number; }
export interface LeaderboardEntry { rank: number; referrerName: string; referrerPhone: string; totalReferrals: number; totalAirtimeEarned: number; }
export interface Volunteer { id: number; fullName: string; phone: string; ward: string; role: string; pollingStation: string | null; isActive: boolean; lastCheckIn: string | null; notes: string | null; createdAt: string; }
export interface PaginatedVolunteers { data: Volunteer[]; total: number; page: number; limit: number; }
export interface Transaction { id: number; type: string; category: string; description: string; amount: number; source: string | null; recordedById: number; createdAt: string; }
export interface PaginatedTransactions { data: Transaction[]; total: number; page: number; limit: number; }
export interface FinanceSummary { totalIncome: number; totalExpenditure: number; balance: number; byCategory: { category: string; type: string; total: number }[]; }
export interface ManifestoItem { id: number; category: string; title: string; description: string; status: "pledge" | "in_progress" | "fulfilled"; priority: number; createdAt: string; updatedAt: string; }

// ─── Query key type aliases (used in pages) ───────────────────────────────────

export type ListVotersSupportLevel = "confirmed" | "leaning" | "undecided" | "opposed" | "unknown";
export type ListRequestsStatus = "received" | "under_review" | "approved" | "declined" | "fulfilled";
export type UpdateRequestBodyStatus = ListRequestsStatus;
export type ListTransactionsType = "income" | "expenditure";

// ─── Query key builders ───────────────────────────────────────────────────────

export const getListVotersQueryKey = (p?: Record<string, any>) => ["voters", p] as const;
export const getGetWardSupportQueryKey = () => ["dashboard", "ward-support"] as const;
export const getGetDashboardSummaryQueryKey = () => ["dashboard", "summary"] as const;
export const getGetRecentActivityQueryKey = () => ["dashboard", "activity"] as const;
export const getListRequestsQueryKey = (p?: Record<string, any>) => ["requests", p] as const;
export const getGetRequestStatsQueryKey = () => ["requests", "stats"] as const;
export const getListBroadcastsQueryKey = (p?: Record<string, any>) => ["broadcasts", p] as const;
export const getListReferralsQueryKey = (p?: Record<string, any>) => ["referrals", p] as const;
export const getGetReferralLeaderboardQueryKey = (p?: Record<string, any>) => ["referrals", "leaderboard", p] as const;
export const getListVolunteersQueryKey = (p?: Record<string, any>) => ["volunteers", p] as const;
export const getListTransactionsQueryKey = (p?: Record<string, any>) => ["finance", "transactions", p] as const;
export const getGetFinanceSummaryQueryKey = () => ["finance", "summary"] as const;
export const getListManifestoItemsQueryKey = (p?: Record<string, any>) => ["manifesto", p] as const;

// ─── Dashboard hooks ──────────────────────────────────────────────────────────

export const useGetDashboardSummary = (options?: { query?: Partial<UseQueryOptions<DashboardSummary>> }) =>
  useQuery<DashboardSummary>({ queryKey: getGetDashboardSummaryQueryKey(), queryFn: () => apiFetch("/api/dashboard/summary"), ...options?.query });

export const useGetWardSupport = (options?: { query?: Partial<UseQueryOptions<WardSupport[]>> }) =>
  useQuery<WardSupport[]>({ queryKey: getGetWardSupportQueryKey(), queryFn: () => apiFetch("/api/dashboard/ward-support"), ...options?.query });

export const useGetRecentActivity = (options?: { query?: Partial<UseQueryOptions<ActivityLog[]>> }) =>
  useQuery<ActivityLog[]>({ queryKey: getGetRecentActivityQueryKey(), queryFn: () => apiFetch("/api/dashboard/activity"), ...options?.query });

// ─── Voter hooks ──────────────────────────────────────────────────────────────

export const useListVoters = (params: Record<string, any> = {}, options?: { query?: Partial<UseQueryOptions<PaginatedVoters>> }) =>
  useQuery<PaginatedVoters>({ queryKey: getListVotersQueryKey(params), queryFn: () => apiFetch(`/api/voters${buildQuery(params)}`), ...options?.query });

export const useCreateVoter = () =>
  useMutation<Voter, Error, { data: Partial<Voter> }>({ mutationFn: ({ data }) => apiFetch("/api/voters", { method: "POST", body: JSON.stringify(data) }) });

export const useUpdateVoter = () =>
  useMutation<Voter, Error, { id: number; data: Partial<Voter> }>({ mutationFn: ({ id, data }) => apiFetch(`/api/voters/${id}`, { method: "PATCH", body: JSON.stringify(data) }) });

export interface ImportVotersResult { imported: number; skipped: number; total: number; errors: string[]; }
export const useImportVotersCsv = () =>
  useMutation<ImportVotersResult, Error, { csv: string }>({
    mutationFn: ({ csv }) => apiFetch("/api/voters/import", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: csv,
    }),
  });

// ─── Request hooks ────────────────────────────────────────────────────────────

export const useListRequests = (params: Record<string, any> = {}, options?: { query?: Partial<UseQueryOptions<PaginatedRequests>> }) =>
  useQuery<PaginatedRequests>({ queryKey: getListRequestsQueryKey(params), queryFn: () => apiFetch(`/api/requests${buildQuery(params)}`), ...options?.query });

export const useGetRequestStats = (options?: { query?: Partial<UseQueryOptions<RequestStats>> }) =>
  useQuery<RequestStats>({ queryKey: getGetRequestStatsQueryKey(), queryFn: () => apiFetch("/api/requests/stats"), ...options?.query });

export const useCreateRequest = () =>
  useMutation<ConstituentRequest, Error, { data: Partial<ConstituentRequest> }>({ mutationFn: ({ data }) => apiFetch("/api/requests", { method: "POST", body: JSON.stringify(data) }) });

export const useUpdateRequest = () =>
  useMutation<ConstituentRequest, Error, { id: number; data: Record<string, any> }>({ mutationFn: ({ id, data }) => apiFetch(`/api/requests/${id}`, { method: "PATCH", body: JSON.stringify(data) }) });

// ─── Broadcast hooks ──────────────────────────────────────────────────────────

export const useListBroadcasts = (params: Record<string, any> = {}, options?: { query?: Partial<UseQueryOptions<PaginatedBroadcasts>> }) =>
  useQuery<PaginatedBroadcasts>({ queryKey: getListBroadcastsQueryKey(params), queryFn: () => apiFetch(`/api/broadcasts${buildQuery(params)}`), ...options?.query });

export const useCreateBroadcast = () =>
  useMutation<Broadcast, Error, { data: Partial<Broadcast> }>({ mutationFn: ({ data }) => apiFetch("/api/broadcasts", { method: "POST", body: JSON.stringify(data) }) });

export const useDeleteBroadcast = () =>
  useMutation<void, Error, { id: number }>({ mutationFn: ({ id }) => apiFetch(`/api/broadcasts/${id}`, { method: "DELETE" }) });

// ─── Referral hooks ───────────────────────────────────────────────────────────

export const useListReferrals = (params: Record<string, any> = {}, options?: { query?: Partial<UseQueryOptions<PaginatedReferrals>> }) =>
  useQuery<PaginatedReferrals>({ queryKey: getListReferralsQueryKey(params), queryFn: () => apiFetch(`/api/referrals${buildQuery(params)}`), ...options?.query });

export const useGetReferralLeaderboard = (params: Record<string, any> = {}, options?: { query?: Partial<UseQueryOptions<LeaderboardEntry[]>> }) =>
  useQuery<LeaderboardEntry[]>({ queryKey: getGetReferralLeaderboardQueryKey(params), queryFn: () => apiFetch(`/api/referrals/leaderboard${buildQuery(params)}`), ...options?.query });

export const useCreateReferral = () =>
  useMutation<Referral, Error, { data: Partial<Referral> }>({ mutationFn: ({ data }) => apiFetch("/api/referrals", { method: "POST", body: JSON.stringify(data) }) });

// ─── Volunteer hooks ──────────────────────────────────────────────────────────

export const useListVolunteers = (params: Record<string, any> = {}, options?: { query?: Partial<UseQueryOptions<PaginatedVolunteers>> }) =>
  useQuery<PaginatedVolunteers>({ queryKey: getListVolunteersQueryKey(params), queryFn: () => apiFetch(`/api/volunteers${buildQuery(params)}`), ...options?.query });

export const useCreateVolunteer = () =>
  useMutation<Volunteer, Error, { data: Partial<Volunteer> }>({ mutationFn: ({ data }) => apiFetch("/api/volunteers", { method: "POST", body: JSON.stringify(data) }) });

export const useUpdateVolunteer = () =>
  useMutation<Volunteer, Error, { id: number; data: Partial<Volunteer> }>({ mutationFn: ({ id, data }) => apiFetch(`/api/volunteers/${id}`, { method: "PATCH", body: JSON.stringify(data) }) });

// ─── Finance hooks ────────────────────────────────────────────────────────────

export const useListTransactions = (params: Record<string, any> = {}, options?: { query?: Partial<UseQueryOptions<PaginatedTransactions>> }) =>
  useQuery<PaginatedTransactions>({ queryKey: getListTransactionsQueryKey(params), queryFn: () => apiFetch(`/api/finance/transactions${buildQuery(params)}`), ...options?.query });

export const useGetFinanceSummary = (options?: { query?: Partial<UseQueryOptions<FinanceSummary>> }) =>
  useQuery<FinanceSummary>({ queryKey: getGetFinanceSummaryQueryKey(), queryFn: () => apiFetch("/api/finance/summary"), ...options?.query });

export const useCreateTransaction = () =>
  useMutation<Transaction, Error, { data: Partial<Transaction> }>({ mutationFn: ({ data }) => apiFetch("/api/finance/transactions", { method: "POST", body: JSON.stringify(data) }) });

// ─── Manifesto hooks ──────────────────────────────────────────────────────────

export const useListManifestoItems = (params: Record<string, any> = {}, options?: { query?: Partial<UseQueryOptions<ManifestoItem[]>> }) =>
  useQuery<ManifestoItem[]>({ queryKey: getListManifestoItemsQueryKey(params), queryFn: () => apiFetch(`/api/manifesto${buildQuery(params)}`), ...options?.query });

export const useCreateManifestoItem = () =>
  useMutation<ManifestoItem, Error, { data: Partial<ManifestoItem> }>({ mutationFn: ({ data }) => apiFetch("/api/manifesto", { method: "POST", body: JSON.stringify(data) }) });

export const useUpdateManifestoItem = () =>
  useMutation<ManifestoItem, Error, { id: number; data: Partial<ManifestoItem> }>({ mutationFn: ({ id, data }) => apiFetch(`/api/manifesto/${id}`, { method: "PATCH", body: JSON.stringify(data) }) });
