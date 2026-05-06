import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const SMS_BROADCASTS_KEY = ["sms-broadcasts"];
const SMS_COUNT_KEY = (ward?: string) => ["sms-recipients-count", ward ?? "all"];

export interface SmsBroadcast {
  id: number;
  message: string;
  ward: string | null;
  sentById: number;
  sentByName: string;
  totalRecipients: number;
  delivered: number;
  failed: number;
  status: string;
  createdAt: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function useSmsBroadcasts() {
  return useQuery<SmsBroadcast[]>({
    queryKey: SMS_BROADCASTS_KEY,
    queryFn: () => apiFetch("/sms/broadcasts"),
  });
}

export function useSmsRecipientsCount(ward?: string) {
  return useQuery<{ count: number }>({
    queryKey: SMS_COUNT_KEY(ward),
    queryFn: () => apiFetch(`/sms/recipients-count${ward ? `?ward=${encodeURIComponent(ward)}` : ""}`),
  });
}

export function useSendSmsBroadcast() {
  const qc = useQueryClient();
  return useMutation<SmsBroadcast, Error, { message: string; ward?: string }>({
    mutationFn: (data) =>
      apiFetch("/sms/broadcast", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SMS_BROADCASTS_KEY });
    },
  });
}
