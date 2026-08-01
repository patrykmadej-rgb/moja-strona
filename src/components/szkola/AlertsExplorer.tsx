"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Info, RefreshCw, Search } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatDateTime } from "@/lib/lab/format";
import { ignoreAlert, markAlertSeen, refreshAlerts, resolveAlert } from "@/app/lab/szkola/alerty/actions";
import {
  ALERT_CATEGORIES,
  ALERT_CATEGORY_LABELS,
  ALERT_PRIORITIES,
  ALERT_PRIORITY_LABELS,
  type AlertCategory,
  type AlertPriority,
  type AlertStatus,
  type SchoolAlert,
  type SchoolSession,
} from "@/lib/szkola/types";

const PRIORITY_BADGE_CLASS: Record<AlertPriority, string> = {
  informacja: "bg-[#e6f0fb] text-[#2a5b86]",
  uwaga: "bg-[#fdf1de] text-[#8a5a12]",
  pilne: "bg-[#fbe9e9] text-[#9a2f2f]",
};

const PRIORITY_ICON: Record<AlertPriority, typeof Info> = {
  informacja: Info,
  uwaga: AlertTriangle,
  pilne: AlertTriangle,
};

function AlertCard({ alert, sessionTitle }: { alert: SchoolAlert; sessionTitle: string | null }) {
  const [status, setStatus] = useState<AlertStatus>(alert.status);
  const [pending, setPending] = useState<string | null>(null);
  const Icon = PRIORITY_ICON[alert.priority];

  const run = async (action: (formData: FormData) => Promise<void>, label: string, nextStatus: AlertStatus) => {
    setPending(label);
    const formData = new FormData();
    formData.set("id", alert.id);
    try {
      await action(formData);
      setStatus(nextStatus);
    } finally {
      setPending(null);
    }
  };

  if (status === "resolved" || status === "ignored") return null;

  return (
    <li className="rounded-[14px] border border-[#e8e2ec] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${PRIORITY_BADGE_CLASS[alert.priority]}`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#201a2b]">{alert.title}</p>
            {alert.description && <p className="mt-0.5 text-xs text-[#706878]">{alert.description}</p>}
            <p className="mt-1 text-xs text-[#9a919f]">
              {[ALERT_CATEGORY_LABELS[alert.category], sessionTitle, formatDateTime(alert.detected_at)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${PRIORITY_BADGE_CLASS[alert.priority]}`}>
          {ALERT_PRIORITY_LABELS[alert.priority]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {alert.action_href && alert.action_label && (
          <Link href={alert.action_href} className="font-medium text-[#5b2a86] hover:underline">
            {alert.action_label}
          </Link>
        )}
        {status === "new" && (
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => run(markAlertSeen, "seen", "seen")}
            className="text-[#706878] hover:underline disabled:opacity-50"
          >
            Oznacz jako zobaczone
          </button>
        )}
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => run(resolveAlert, "resolve", "resolved")}
          className="text-emerald-700 hover:underline disabled:opacity-50"
        >
          Rozwiąż
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => run(ignoreAlert, "ignore", "ignored")}
          className="text-[#706878] hover:underline disabled:opacity-50"
        >
          Zignoruj
        </button>
      </div>
    </li>
  );
}

export default function AlertsExplorer({ alerts, sessions }: { alerts: SchoolAlert[]; sessions: SchoolSession[] }) {
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | "">("");
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority | "">("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [query, setQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSummary, setRefreshSummary] = useState<string | null>(null);

  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === "new" || a.status === "seen"), [alerts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeAlerts
      .filter((a) => !categoryFilter || a.category === categoryFilter)
      .filter((a) => !priorityFilter || a.priority === priorityFilter)
      .filter((a) => !sessionFilter || a.session_id === sessionFilter)
      .filter((a) => !q || `${a.title} ${a.description ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }, [activeAlerts, categoryFilter, priorityFilter, sessionFilter, query]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshSummary(null);
    try {
      const result = await refreshAlerts();
      setRefreshSummary(`Sprawdzono ${result.recordsProcessed} zjazdów, utworzono ${result.alertsCreated} nowych alertów.`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative w-full sm:max-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj alertu…"
              className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none focus:border-[#5b2a86]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as AlertCategory | "")}
            aria-label="Filtruj po kategorii"
            className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
          >
            <option value="">Wszystkie kategorie</option>
            {ALERT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ALERT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as AlertPriority | "")}
            aria-label="Filtruj po priorytecie"
            className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
          >
            <option value="">Wszystkie priorytety</option>
            {ALERT_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {ALERT_PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
          {sessions.length > 0 && (
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              aria-label="Filtruj po zjeździe"
              className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
            >
              <option value="">Wszystkie zjazdy</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
        >
          <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} strokeWidth={1.75} />
          {isRefreshing ? "Sprawdzanie…" : "Sprawdź teraz"}
        </button>
      </div>

      {refreshSummary && <p className="text-xs text-[#706878]">{refreshSummary}</p>}

      {filtered.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={Bell}
            title={activeAlerts.length === 0 ? "Brak aktywnych alertów" : "Nic nie pasuje do filtrów"}
            subtitle={activeAlerts.length === 0 ? "Wszystko wygląda w porządku." : "Zmień wyszukiwanie lub filtry."}
          />
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} sessionTitle={alert.session_id ? sessionsById.get(alert.session_id)?.title ?? null : null} />
          ))}
        </ul>
      )}
    </div>
  );
}
