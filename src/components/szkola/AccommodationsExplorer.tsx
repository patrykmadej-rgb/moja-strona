"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Bed, Search } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import AccommodationFormFields from "@/components/szkola/AccommodationFormFields";
import SessionSuggestionModal from "@/components/szkola/SessionSuggestionModal";
import ChooseSessionModal from "@/components/szkola/ChooseSessionModal";
import {
  createAccommodationGeneral,
  deleteAccommodationGeneral,
  linkAccommodationToSession,
  unlinkAccommodationFromSession,
  updateAccommodationGeneral,
} from "@/app/lab/szkola/zakwaterowanie/actions";
import { findSuggestedSession, type FindSuggestedSessionResult } from "@/lib/szkola/sessionSuggestion";
import { formatMoney } from "@/lib/szkola/money";
import { formatSessionDateRange } from "@/lib/szkola/format";
import {
  ACCOMMODATION_STATUSES,
  ACCOMMODATION_STATUS_LABELS,
  type Accommodation,
  type AccommodationStatus,
  type SchoolSession,
} from "@/lib/szkola/types";

type LinkFilter = "wszystkie" | "powiazane" | "niepowiazane";

function accommodationToSuggestionInput(a: { check_in: string | null; check_out: string | null; city: string | null }) {
  return { type: "accommodation" as const, startDate: a.check_in, endDate: a.check_out, city: a.city };
}

function formDataToSuggestionFields(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim() || null;
  return { check_in: get("check_in"), check_out: get("check_out"), city: get("city") };
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

type FlowState =
  | { step: "idle" }
  | { step: "adding" }
  | { step: "editing"; accommodation: Accommodation }
  | { step: "suggesting"; accommodation: Accommodation; result: FindSuggestedSessionResult }
  | { step: "choosing"; accommodation: Accommodation; candidates: SchoolSession[] };

function AccommodationRow({
  accommodation,
  sessionsById,
  onEdit,
  onLinkClick,
  onUnlink,
  onDelete,
}: {
  accommodation: Accommodation;
  sessionsById: Map<string, SchoolSession>;
  onEdit: () => void;
  onLinkClick: () => void;
  onUnlink: () => void;
  onDelete: () => void;
}) {
  const [isUnlinking, startUnlink] = useTransition();
  const session = accommodation.session_id ? sessionsById.get(accommodation.session_id) : null;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee9f2] py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#201a2b]">{accommodation.name}</p>
        <p className="mt-0.5 truncate text-xs text-[#706878]">
          {[
            accommodation.city,
            accommodation.check_in && accommodation.check_out ? `${accommodation.check_in} → ${accommodation.check_out}` : null,
            accommodation.price != null ? formatMoney(accommodation.price, accommodation.currency) : null,
            ACCOMMODATION_STATUS_LABELS[accommodation.payment_status],
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {session ? (
          <p className="mt-1 text-xs text-[#5b2a86]">
            Powiązany zjazd: {session.session_number ? `Zjazd ${session.session_number}` : session.title} ·{" "}
            {formatSessionDateRange(session.start_date, session.end_date)}
          </p>
        ) : (
          <p className="mt-1 text-xs font-medium text-[#a76616]">Nieprzypisane do zjazdu</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {session ? (
          <>
            <button type="button" onClick={onLinkClick} className="text-sm text-[#5b2a86] hover:underline">
              Zmień powiązanie
            </button>
            <button
              type="button"
              disabled={isUnlinking}
              onClick={() => startUnlink(onUnlink)}
              className="text-sm text-[#706878] hover:underline disabled:opacity-50"
            >
              Usuń powiązanie
            </button>
          </>
        ) : (
          <button type="button" onClick={onLinkClick} className="text-sm font-medium text-[#5b2a86] hover:underline">
            Powiąż ze zjazdem
          </button>
        )}
        <button type="button" onClick={onEdit} className="text-sm text-[#5b2a86] hover:underline">
          Edytuj
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Usunąć nocleg „${accommodation.name}”?`)) onDelete();
          }}
          className="text-sm text-red-600 hover:underline"
        >
          Usuń
        </button>
      </div>
    </li>
  );
}

export default function AccommodationsExplorer({ accommodations, sessions }: { accommodations: Accommodation[]; sessions: SchoolSession[] }) {
  const [sessionFilter, setSessionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccommodationStatus | "">("");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("wszystkie");
  const [query, setQuery] = useState("");
  const [flow, setFlow] = useState<FlowState>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const addFormRef = useRef<HTMLFormElement>(null);

  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accommodations
      .filter((a) => !sessionFilter || a.session_id === sessionFilter)
      .filter((a) => !statusFilter || a.payment_status === statusFilter)
      .filter((a) => (linkFilter === "wszystkie" ? true : linkFilter === "powiazane" ? Boolean(a.session_id) : !a.session_id))
      .filter((a) => {
        if (!q) return true;
        return `${a.name} ${a.city ?? ""} ${a.address ?? ""}`.toLowerCase().includes(q);
      });
  }, [accommodations, sessionFilter, statusFilter, linkFilter, query]);

  const groups = useMemo(() => {
    const bySession = new Map<string, Accommodation[]>();
    const unassigned: Accommodation[] = [];
    for (const a of filtered) {
      if (!a.session_id) {
        unassigned.push(a);
        continue;
      }
      const list = bySession.get(a.session_id) ?? [];
      list.push(a);
      bySession.set(a.session_id, list);
    }
    const sortByCheckIn = (a: Accommodation, b: Accommodation) => (a.check_in ?? "").localeCompare(b.check_in ?? "");
    unassigned.sort(sortByCheckIn);

    const sessionGroups = Array.from(bySession.entries())
      .map(([sessionId, items]) => ({ session: sessionsById.get(sessionId) ?? null, sessionId, items: [...items].sort(sortByCheckIn) }))
      .sort((a, b) => (a.session?.start_date ?? "").localeCompare(b.session?.start_date ?? ""));

    return { unassigned, sessionGroups };
  }, [filtered, sessionsById]);

  function closeFlow() {
    setFlow({ step: "idle" });
    setError(null);
  }

  function runSuggestion(accommodation: Accommodation) {
    const result = findSuggestedSession({ ...accommodationToSuggestionInput(accommodation), sessions });
    setFlow({ step: "suggesting", accommodation, result });
  }

  async function handleLink(accommodation: Accommodation, session: SchoolSession) {
    setError(null);
    startTransition(async () => {
      try {
        await linkAccommodationToSession(accommodation.id, session.id);
        closeFlow();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się powiązać noclegu ze zjazdem.");
      }
    });
  }

  async function handleUnlink(accommodation: Accommodation) {
    try {
      await unlinkAccommodationFromSession(accommodation.id, accommodation.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć powiązania.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:max-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj nazwy, miasta, adresu…"
              className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none focus:border-[#5b2a86]"
            />
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-[10px] border border-[#e8e2ec] bg-[#fbfafc] p-1">
            {(["wszystkie", "powiazane", "niepowiazane"] as LinkFilter[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setLinkFilter(key)}
                className={
                  linkFilter === key
                    ? "rounded-[7px] bg-[#f1eafd] px-3 py-1.5 text-[12px] font-medium text-[#5b2a86]"
                    : "rounded-[7px] px-3 py-1.5 text-[12px] font-medium text-[#706878] hover:bg-white"
                }
              >
                {key === "wszystkie" ? "Wszystkie" : key === "powiazane" ? "Powiązane" : "Niepowiązane"}
              </button>
            ))}
          </div>
          <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]">
            <option value="">Wszystkie zjazdy</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AccommodationStatus | "")} className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]">
            <option value="">Wszystkie statusy</option>
            {ACCOMMODATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ACCOMMODATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setFlow({ step: "adding" })}
          className="shrink-0 rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#32134f]"
        >
          + Dodaj zakwaterowanie
        </button>
      </div>

      {flow.step === "adding" && (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <h2 className="text-sm font-semibold text-[#201a2b]">Nowe zakwaterowanie</h2>
          <form
            ref={addFormRef}
            action={async (formData) => {
              setError(null);
              try {
                const { id } = await createAccommodationGeneral(formData);
                const fields = formDataToSuggestionFields(formData);
                const result = findSuggestedSession({ ...accommodationToSuggestionInput(fields), sessions });
                const created: Accommodation = {
                  id,
                  session_id: null,
                  name: String(formData.get("name") ?? ""),
                  address: (String(formData.get("address") ?? "").trim() || null) as string | null,
                  city: fields.city,
                  check_in: fields.check_in,
                  check_out: fields.check_out,
                  price: null,
                  currency: "PLN",
                  payment_status: "do_znalezienia",
                  reservation_number: null,
                  cancellation_policy: null,
                  free_cancellation_until: null,
                  breakfast_included: false,
                  distance_to_venue: null,
                  travel_time_to_venue: null,
                  link: null,
                  notes: null,
                  created_at: "",
                };
                addFormRef.current?.reset();
                setFlow({ step: "suggesting", accommodation: created, result });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się dodać noclegu.");
              }
            }}
            className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
          >
            <AccommodationFormFields />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <SubmitButton label="Zapisz" pendingLabel="Zapisywanie…" />
              <button
                type="button"
                onClick={closeFlow}
                className="rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#706878] hover:border-[#d9cde5]"
              >
                Anuluj
              </button>
            </div>
          </form>
        </section>
      )}

      {flow.step === "editing" && (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <h2 className="text-sm font-semibold text-[#201a2b]">Edytuj zakwaterowanie</h2>
          <form
            action={async (formData) => {
              setError(null);
              formData.set("id", flow.accommodation.id);
              try {
                await updateAccommodationGeneral(formData);
                closeFlow();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się zapisać noclegu.");
              }
            }}
            className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
          >
            <AccommodationFormFields accommodation={flow.accommodation} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <SubmitButton label="Zapisz" pendingLabel="Zapisywanie…" />
              <button
                type="button"
                onClick={closeFlow}
                className="rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#706878] hover:border-[#d9cde5]"
              >
                Anuluj
              </button>
            </div>
          </form>
        </section>
      )}

      {flow.step === "suggesting" && (
        <SessionSuggestionModal
          result={flow.result}
          isSubmitting={isPending}
          onConfirm={(session) => handleLink(flow.accommodation, session)}
          onChooseOther={() =>
            setFlow({
              step: "choosing",
              accommodation: flow.accommodation,
              candidates: flow.result.suggestedSession ? [flow.result.suggestedSession, ...flow.result.alternativeSessions] : flow.result.alternativeSessions,
            })
          }
          onSaveWithoutLink={closeFlow}
          onBackToEdit={() => setFlow({ step: "editing", accommodation: flow.accommodation })}
        />
      )}

      {flow.step === "choosing" && (
        <ChooseSessionModal
          sessions={flow.candidates}
          isSubmitting={isPending}
          onConfirm={(session) => handleLink(flow.accommodation, session)}
          onCancel={closeFlow}
        />
      )}

      {error && flow.step === "idle" && <p className="text-sm text-red-600">{error}</p>}

      {groups.unassigned.length === 0 && groups.sessionGroups.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={Bed}
            title={accommodations.length === 0 ? "Brak zakwaterowania" : "Nic nie pasuje do filtrów"}
            subtitle={accommodations.length === 0 ? "Dodaj pierwszą rezerwację noclegu." : "Zmień wyszukiwanie lub filtry."}
            action={accommodations.length === 0 ? { label: "Dodaj zakwaterowanie", onClick: () => setFlow({ step: "adding" }) } : undefined}
            compact
          />
        </section>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.unassigned.length > 0 && (
            <section className="rounded-[16px] border border-amber-200 bg-amber-50/40 px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
              <h3 className="pt-4 text-xs font-semibold uppercase tracking-wide text-[#a76616]">Nieprzypisane do zjazdu</h3>
              <ul>
                {groups.unassigned.map((accommodation) => (
                  <AccommodationRow
                    key={accommodation.id}
                    accommodation={accommodation}
                    sessionsById={sessionsById}
                    onEdit={() => setFlow({ step: "editing", accommodation })}
                    onLinkClick={() => runSuggestion(accommodation)}
                    onUnlink={() => handleUnlink(accommodation)}
                    onDelete={async () => {
                      try {
                        const fd = new FormData();
                        fd.set("id", accommodation.id);
                        await deleteAccommodationGeneral(fd);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Nie udało się usunąć noclegu.");
                      }
                    }}
                  />
                ))}
              </ul>
            </section>
          )}

          {groups.sessionGroups.map(({ session, sessionId, items }) => (
            <section key={sessionId} className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
              <h3 className="pt-4 text-xs font-semibold uppercase tracking-wide text-[#5b2a86]">
                {session
                  ? `${session.session_number ? `Zjazd ${session.session_number}` : session.title}${session.city ? ` · ${session.city}` : ""} · ${formatSessionDateRange(session.start_date, session.end_date)}`
                  : "Nieznany zjazd"}
              </h3>
              <ul>
                {items.map((accommodation) => (
                  <AccommodationRow
                    key={accommodation.id}
                    accommodation={accommodation}
                    sessionsById={sessionsById}
                    onEdit={() => setFlow({ step: "editing", accommodation })}
                    onLinkClick={() => runSuggestion(accommodation)}
                    onUnlink={() => handleUnlink(accommodation)}
                    onDelete={async () => {
                      try {
                        const fd = new FormData();
                        fd.set("id", accommodation.id);
                        await deleteAccommodationGeneral(fd);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Nie udało się usunąć noclegu.");
                      }
                    }}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
