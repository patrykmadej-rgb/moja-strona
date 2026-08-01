"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  History,
  Link2,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Unplug,
} from "lucide-react";
import {
  connectIcsCalendar,
  disconnectCalendar,
  listAvailableCalendars,
  runManualSync,
  selectCalendar,
  toggleCalendarSync,
  type ConnectIcsResult,
} from "@/app/lab/szkola/kalendarz/actions";
import { formatDateTime } from "@/lib/lab/format";
import type { CalendarConnectionSummary, SchoolCalendarSyncRun } from "@/lib/szkola/types";

type GoogleCalendarOption = { id: string; summary: string; backgroundColor?: string; primary?: boolean };

const CALENDAR_ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Integracja przez konto Google wymaga konfiguracji Google Cloud (opcjonalny, dodatkowy sposób połączenia).",
  access_denied: "Odmówiono dostępu do kalendarza Google.",
  invalid_state: "Sesja autoryzacji wygasła lub jest nieprawidłowa — spróbuj połączyć ponownie.",
  no_refresh_token: "Google nie zwrócił tokenu odświeżania. Spróbuj ponownie i zaakceptuj pełną zgodę.",
  token_exchange_failed: "Nie udało się dokończyć autoryzacji Google.",
};

const inputClass =
  "h-9 w-full rounded-[10px] border border-[#e8e2ec] bg-white px-3 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

function SyncSummaryToast({ result, onClose }: { result: NonNullable<Awaited<ReturnType<typeof runManualSync>>>; onClose: () => void }) {
  return (
    <div className="mt-4 rounded-[10px] border border-[#d9cde5] bg-[#f1eafd] p-4 text-sm text-[#32134f]">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">Synchronizacja zakończona</p>
        <button type="button" onClick={onClose} className="text-xs text-[#5b2a86] hover:underline">
          Zamknij
        </button>
      </div>
      <ul className="mt-2 space-y-0.5 text-xs text-[#4c1f72]">
        <li>Pobrano {result.eventsReceived} wydarzeń</li>
        <li>{result.eventsCreated} nowych</li>
        <li>{result.eventsUpdated} zmienionych</li>
        <li>{result.eventsDeleted} usuniętych</li>
        {result.conflictsDetected > 0 ? (
          <li className="font-medium text-red-700">Wykryto {result.conflictsDetected} potencjalny(ch) konflikt(ów)</li>
        ) : (
          <li>Brak konfliktów</li>
        )}
      </ul>
    </div>
  );
}

type ConnectIcsSuccess = Extract<ConnectIcsResult, { success: true }>;

function IcsConnectSuccessToast({ result, onClose }: { result: ConnectIcsSuccess; onClose: () => void }) {
  return (
    <div className="mt-4 rounded-[10px] border border-[#d9cde5] bg-[#f1eafd] p-4 text-sm text-[#32134f]">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">Kalendarz został połączony</p>
        <button type="button" onClick={onClose} className="text-xs text-[#5b2a86] hover:underline">
          Zamknij
        </button>
      </div>
      <ul className="mt-2 space-y-0.5 text-xs text-[#4c1f72]">
        <li>Znaleziono {result.eventsFound} {result.eventsFound === 1 ? "wydarzenie" : "wydarzeń"}</li>
        {result.nearestEventTitle && (
          <li>
            Najbliższe wydarzenie: {result.nearestEventTitle}
            {result.nearestEventAt && ` (${formatDateTime(result.nearestEventAt)})`}
          </li>
        )}
        <li>Ostatnia aktualizacja: {formatDateTime(result.syncedAt)}</li>
      </ul>
    </div>
  );
}

function IcsConnectForm({
  initialName,
  initialTimezone,
  submitLabel,
  onConnected,
  onCancel,
}: {
  initialName?: string;
  initialTimezone?: string;
  submitLabel: string;
  onConnected: (result: ConnectIcsSuccess) => void;
  onCancel?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        setPending(true);
        try {
          const result = await connectIcsCalendar(formData);
          if (result.success) {
            onConnected(result);
          } else {
            setError(result.message);
          }
        } catch (err) {
          // Nie powinno się zdarzyć — connectIcsCalendar zawsze zwraca kontrolowany
          // wynik — ale zabezpieczenie na wypadek nieoczekiwanego błędu sieci/klienta.
          setError(err instanceof Error ? err.message : "Nie udało się połączyć kalendarza.");
        } finally {
          setPending(false);
        }
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Nazwa kalendarza</label>
        <input name="calendar_name" required defaultValue={initialName} placeholder="np. Kalendarz szkoły" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Adres subskrypcji ICS</label>
        <input name="ics_url" required placeholder="webcal://... lub https://....ics" className={inputClass} />
        <p className="text-xs text-[#706878]">
          Wklej link otrzymany od szkoły. Może zaczynać się od webcal:// lub https:// i zwykle prowadzi do pliku .ics.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Domyślna strefa czasowa</label>
        <input name="default_timezone" defaultValue={initialTimezone ?? "Europe/Warsaw"} className={inputClass} />
      </div>
      <label className="flex items-center gap-2 text-sm text-[#201a2b]">
        <input type="checkbox" name="sync_enabled" defaultChecked className="h-4 w-4 accent-[#5b2a86]" />
        Synchronizacja automatyczna włączona (raz w tygodniu)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Link2 className="h-4 w-4" strokeWidth={1.75} />}
          {pending ? "Testowanie połączenia…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-[#706878] hover:underline">
            Anuluj
          </button>
        )}
      </div>
    </form>
  );
}

function GoogleOAuthSection({
  connection,
  onError,
}: {
  connection: CalendarConnectionSummary | null;
  onError: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPickingCalendar, setIsPickingCalendar] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState<GoogleCalendarOption[] | null>(null);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);

  const openCalendarPicker = async () => {
    onError("");
    setIsPickingCalendar(true);
    setIsLoadingCalendars(true);
    try {
      const calendars = await listAvailableCalendars();
      setAvailableCalendars(calendars);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nie udało się pobrać listy kalendarzy.");
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  return (
    <div className="mt-5 border-t border-[#eee9f2] pt-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-[#706878] hover:text-[#5b2a86]"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} strokeWidth={1.75} />
        Inne metody połączenia
      </button>

      {expanded && (
        <div className="mt-3 rounded-[10px] border border-[#e8e2ec] bg-[#fbfafc] p-4">
          <p className="text-xs font-medium text-[#201a2b]">Połącz przez konto Google (opcjonalne, przyszłościowe)</p>
          <p className="mt-1 text-xs text-[#9a919f]">
            Wymaga, żeby kalendarz był udostępniony bezpośrednio na koncie Google i konfiguracji Google Cloud po stronie
            serwera. Jeśli masz tylko link subskrypcji ICS od szkoły, użyj formularza powyżej — nie musisz tego
            konfigurować.
          </p>

          {!isPickingCalendar ? (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- to Route Handler robiący przekierowanie do Google, nie strona Next.js
            <a
              href="/api/szkola/calendar/oauth/start"
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-[#e8e2ec] px-3 text-xs font-medium text-[#5b2a86] hover:border-[#d9cde5] hover:bg-white"
            >
              <CalendarCheck2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Połącz Google Calendar
            </a>
          ) : isLoadingCalendars ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#706878]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
              Wczytywanie listy kalendarzy…
            </div>
          ) : availableCalendars === null ? (
            <button
              type="button"
              onClick={openCalendarPicker}
              className="mt-3 rounded-[9px] bg-[#5b2a86] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#32134f]"
            >
              Wczytaj listę kalendarzy
            </button>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {availableCalendars.map((cal) => (
                <li key={cal.id}>
                  <form
                    action={async (formData) => {
                      try {
                        await selectCalendar(formData);
                        setIsPickingCalendar(false);
                      } catch (err) {
                        onError(err instanceof Error ? err.message : "Nie udało się zapisać kalendarza.");
                      }
                    }}
                  >
                    <input type="hidden" name="calendar_id" value={cal.id} />
                    <input type="hidden" name="calendar_name" value={cal.summary} />
                    <input type="hidden" name="calendar_color" value={cal.backgroundColor ?? ""} />
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-[9px] border border-[#e8e2ec] bg-white px-3 py-2 text-left text-xs text-[#201a2b] hover:border-[#d9cde5] hover:bg-[#f1eafd]"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cal.backgroundColor ?? "#5b2a86" }} />
                      <span className="flex-1">{cal.summary}</span>
                      {cal.primary && <span className="text-[10px] text-[#9a919f]">główny</span>}
                    </button>
                  </form>
                </li>
              ))}
              {availableCalendars.length === 0 && <p className="text-xs text-[#706878]">Brak dostępnych kalendarzy na tym koncie.</p>}
            </ul>
          )}

          {connection?.connection_type === "google_oauth" && (
            <p className="mt-2 text-xs text-[#5b2a86]">Aktualnie połączono przez konto Google.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarConnectionCard({
  googleConfigured,
  adminConfigured,
  connection,
  eventsCount,
  pendingChangesCount,
  conflictsCount,
  latestSyncRun,
  calendarErrorCode,
}: {
  googleConfigured: boolean;
  adminConfigured: boolean;
  connection: CalendarConnectionSummary | null;
  eventsCount: number;
  pendingChangesCount: number;
  conflictsCount: number;
  latestSyncRun: SchoolCalendarSyncRun | null;
  calendarErrorCode?: string;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTogglingSync, setIsTogglingSync] = useState(false);
  const [isChangingLink, setIsChangingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<Awaited<ReturnType<typeof runManualSync>> | null>(null);
  const [connectResult, setConnectResult] = useState<ConnectIcsSuccess | null>(null);

  const handleManualSync = async () => {
    setError(null);
    setSyncResult(null);
    setIsSyncing(true);
    try {
      const result = await runManualSync();
      setSyncResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synchronizacja nie powiodła się.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSync = async () => {
    if (!connection) return;
    setError(null);
    setIsTogglingSync(true);
    const formData = new FormData();
    formData.set("sync_enabled", String(!connection.sync_enabled));
    try {
      await toggleCalendarSync(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić synchronizacji.");
    } finally {
      setIsTogglingSync(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Usunąć połączenie z kalendarzem? Historia zmian zostanie zachowana, ale automatyczna synchronizacja się zatrzyma.")) return;
    setError(null);
    setIsDisconnecting(true);
    try {
      await disconnectCalendar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć połączenia.");
      setIsDisconnecting(false);
    }
  };

  // Brak połączenia — pokaż formularz ICS jako podstawowy, widoczny sposób połączenia.
  if (!connection) {
    return (
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        {calendarErrorCode && (
          <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {CALENDAR_ERROR_MESSAGES[calendarErrorCode] ?? "Wystąpił błąd podczas łączenia kalendarza."}
          </div>
        )}

        {!adminConfigured ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#efedf0] text-[#6f6874]">
              <CalendarCheck2 className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="mt-1 text-sm font-medium text-[#201a2b]">Integracja kalendarza wymaga konfiguracji</p>
            <p className="max-w-sm text-xs text-[#9a919f]">
              Brakuje zmiennej środowiskowej po stronie serwera (SUPABASE_SERVICE_ROLE_KEY). Kod integracji jest gotowy —
              po dodaniu klucza w konfiguracji hostingu ta strona pozwoli połączyć kalendarz przez link ICS.
            </p>
          </div>
        ) : connectResult ? (
          <IcsConnectSuccessToast result={connectResult} onClose={() => setConnectResult(null)} />
        ) : (
          <>
            <h2 className="text-sm font-semibold text-[#201a2b]">Połącz kalendarz przez link subskrypcji</h2>
            <p className="mt-1 text-xs text-[#706878]">
              Podstawowy sposób połączenia — nie wymaga logowania się kontem Google ani żadnej konfiguracji Google Cloud.
            </p>
            <div className="mt-4">
              <IcsConnectForm submitLabel="Połącz kalendarz" onConnected={setConnectResult} />
            </div>
          </>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {adminConfigured && (
          <>
            <GoogleOAuthSection connection={connection} onError={setError} />
            {!googleConfigured && <p className="mt-2 text-[11px] text-[#c3bcc9]">(Wariant Google wymaga jeszcze konfiguracji.)</p>}
          </>
        )}
      </section>
    );
  }

  // Połączono — stan A/B/C ze specyfikacji.
  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      {isChangingLink ? (
        <div>
          <h2 className="text-sm font-semibold text-[#201a2b]">Zmień link subskrypcji</h2>
          <p className="mt-1 text-xs text-[#706878]">Wklej nowy link — zastąpi obecnie zapisany.</p>
          <div className="mt-4">
            <IcsConnectForm
              initialName={connection.calendar_name ?? ""}
              submitLabel="Zapisz nowy link"
              onConnected={(result) => {
                setConnectResult(result);
                setIsChangingLink(false);
              }}
              onCancel={() => setIsChangingLink(false)}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
                <p className="text-sm font-medium text-[#201a2b]">Kalendarz połączony</p>
                {!connection.sync_enabled && (
                  <span className="rounded-full bg-[#efedf0] px-2 py-0.5 text-[11px] text-[#6f6874]">synchronizacja wyłączona</span>
                )}
              </div>
              <p className="mt-1 text-sm text-[#201a2b]">{connection.calendar_name || "Kalendarz szkoły"}</p>
              <p className="mt-0.5 text-xs text-[#9a919f]">
                {connection.connection_type === "ics_url"
                  ? connection.masked_ics_url ?? "link ICS"
                  : "połączono przez konto Google"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-3 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <RefreshCw className="h-4 w-4" strokeWidth={1.75} />}
                {isSyncing ? "Sprawdzanie…" : "Sprawdź teraz"}
              </button>
              {connection.connection_type === "ics_url" ? (
                <button
                  type="button"
                  onClick={() => setIsChangingLink(true)}
                  className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd]"
                >
                  Zmień link
                </button>
              ) : (
                // eslint-disable-next-line @next/next/no-html-link-for-pages -- to Route Handler robiący przekierowanie do Google, nie strona Next.js
                <a
                  href="/api/szkola/calendar/oauth/start"
                  className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd]"
                >
                  Zmień kalendarz
                </a>
              )}
              <button
                type="button"
                onClick={handleToggleSync}
                disabled={isTogglingSync}
                className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-50"
              >
                {connection.sync_enabled ? <Pause className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Play className="h-3.5 w-3.5" strokeWidth={1.75} />}
                {connection.sync_enabled ? "Wyłącz synchronizację" : "Włącz synchronizację"}
              </button>
              <Link
                href="/lab/szkola/kalendarz/zmiany"
                className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd]"
              >
                <History className="h-3.5 w-3.5" strokeWidth={1.75} />
                Historia zmian
              </Link>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 text-sm text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Unplug className="h-3.5 w-3.5" strokeWidth={1.75} />}
                Usuń połączenie
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 min-[600px]:grid-cols-4">
            <div>
              <p className="text-lg font-semibold text-[#201a2b]">{eventsCount}</p>
              <p className="text-xs text-[#706878]">wydarzeń</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#201a2b]">{pendingChangesCount}</p>
              <p className="text-xs text-[#706878]">nierozpatrzonych zmian</p>
            </div>
            <div>
              <p className="text-xs text-[#706878]">Ostatnia synchronizacja</p>
              <p className="text-sm text-[#201a2b]">{connection.last_synced_at ? formatDateTime(connection.last_synced_at) : "nigdy"}</p>
            </div>
            <div>
              <p className="text-xs text-[#706878]">Następne sprawdzenie</p>
              <p className="text-sm text-[#201a2b]">
                {connection.sync_enabled && connection.next_sync_at ? formatDateTime(connection.next_sync_at) : "tylko ręcznie"}
              </p>
            </div>
          </div>

          {conflictsCount > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span>
                {conflictsCount === 1 ? "1 zmiana może kolidować" : `${conflictsCount} zmiany mogą kolidować`} z podróżą lub noclegiem.{" "}
                <Link href="/lab/szkola/kalendarz/zmiany?impact=conflict" className="font-medium underline">
                  Zobacz konflikty
                </Link>
              </span>
            </div>
          )}

          {connection.last_error && <p className="mt-3 text-xs text-red-600">Ostatni błąd synchronizacji: {connection.last_error}</p>}

          {latestSyncRun && !connection.last_error && (
            <p className="mt-3 text-xs text-[#9a919f]">
              Ostatnie sprawdzenie ({latestSyncRun.sync_type === "manual" ? "ręczne" : latestSyncRun.sync_type === "scheduled" ? "automatyczne" : "pierwsze"}):{" "}
              {latestSyncRun.status === "success" ? "zakończone sukcesem" : latestSyncRun.status === "error" ? "zakończone błędem" : "w toku"}.
            </p>
          )}

          {syncResult && <SyncSummaryToast result={syncResult} onClose={() => setSyncResult(null)} />}
          {connectResult && <IcsConnectSuccessToast result={connectResult} onClose={() => setConnectResult(null)} />}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!isChangingLink && <GoogleOAuthSection connection={connection} onError={setError} />}
    </section>
  );
}
