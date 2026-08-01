"use client";

import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarDays, Copy, Download, Ellipsis } from "lucide-react";
import {
  addScheduleItem,
  deleteScheduleItem,
  duplicateScheduleDay,
  duplicateScheduleItem,
  moveScheduleItem,
  updateScheduleItem,
} from "@/app/lab/szkola/zjazdy/[id]/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatHours, formatWeekdayDate } from "@/lib/szkola/format";
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  type SessionScheduleItem,
} from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

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

function ScheduleItemFields({ item, defaultDate }: { item?: SessionScheduleItem; defaultDate?: string }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data *</label>
          <input
            name="item_date"
            type="date"
            required
            defaultValue={item?.item_date ?? defaultDate ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Początek</label>
          <input
            name="start_time"
            type="time"
            defaultValue={item?.start_time?.slice(0, 5) ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Koniec</label>
          <input
            name="end_time"
            type="time"
            defaultValue={item?.end_time?.slice(0, 5) ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Nazwa zajęć *</label>
        <input name="title" required defaultValue={item?.title ?? ""} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Typ zajęć</label>
          <select name="activity_type" defaultValue={item?.activity_type ?? ""} className={inputClass}>
            <option value="">Nie określono</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Prowadzący</label>
          <input name="trainer" defaultValue={item?.trainer ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Sala</label>
          <input name="room" defaultValue={item?.room ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Lokalizacja</label>
          <input name="location" defaultValue={item?.location ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Liczba godzin</label>
          <input
            name="hours"
            type="number"
            min={0}
            step="0.25"
            placeholder="auto"
            defaultValue={item?.hours ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Notatka</label>
        <textarea name="notes" rows={2} defaultValue={item?.notes ?? ""} className={inputClass} />
      </div>
    </>
  );
}

function ScheduleItemMenu({
  sessionId,
  item,
  onEdit,
  canMoveUp,
  canMoveDown,
}: {
  sessionId: string;
  item: SessionScheduleItem;
  onEdit: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu punktu planu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#706878] transition-colors hover:bg-[#f1eafd] hover:text-[#4c1f72]"
      >
        <Ellipsis className="h-4 w-4" strokeWidth={1.75} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-44 rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]"
          >
            <button
              type="button"
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
            >
              Edytuj
            </button>
            {canMoveUp && (
              <button
                type="button"
                onClick={() => {
                  moveScheduleItem(sessionId, item.id, "up");
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
              >
                Przesuń wyżej
              </button>
            )}
            {canMoveDown && (
              <button
                type="button"
                onClick={() => {
                  moveScheduleItem(sessionId, item.id, "down");
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
              >
                Przesuń niżej
              </button>
            )}
            <form action={duplicateScheduleItem} onSubmit={() => setOpen(false)}>
              <input type="hidden" name="session_id" value={sessionId} />
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="block w-full px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
              >
                Duplikuj
              </button>
            </form>
            <form
              action={deleteScheduleItem}
              onSubmit={(e) => {
                setOpen(false);
                if (!confirm(`Usunąć punkt „${item.title}”?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="session_id" value={sessionId} />
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="block w-full border-t border-[#eee9f2] px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Usuń
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function ScheduleItemRow({
  sessionId,
  item,
  canMoveUp,
  canMoveDown,
}: {
  sessionId: string;
  item: SessionScheduleItem;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isEditing) {
    return (
      <li className="border-b border-[#eee9f2] py-4 last:border-b-0">
        <form
          action={async (formData) => {
            setError(null);
            try {
              await updateScheduleItem(formData);
              setIsEditing(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się zapisać punktu planu.");
            }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={item.id} />
          <ScheduleItemFields item={item} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <SubmitButton label="Zapisz" pendingLabel="Zapisywanie…" />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#706878] hover:border-[#d9cde5]"
            >
              Anuluj
            </button>
          </div>
        </form>
      </li>
    );
  }

  const timeLabel =
    item.start_time && item.end_time
      ? `${item.start_time.slice(0, 5)}–${item.end_time.slice(0, 5)}`
      : item.start_time
        ? item.start_time.slice(0, 5)
        : "—";

  return (
    <li className="flex flex-col gap-2 border-b border-[#eee9f2] py-4 last:border-b-0 min-[700px]:flex-row min-[700px]:items-start min-[700px]:gap-5">
      <div className="shrink-0 text-sm font-semibold text-[#5b2a86] min-[700px]:w-[100px]">{timeLabel}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#201a2b]">{item.title}</p>
        <p className="mt-0.5 text-xs text-[#706878]">
          {[
            item.activity_type ? ACTIVITY_TYPE_LABELS[item.activity_type] : null,
            item.trainer ? `Prowadzący: ${item.trainer}` : null,
            item.room ? `Sala: ${item.room}` : null,
            item.location,
            item.hours ? formatHours(item.hours) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {item.notes && <p className="mt-1 text-xs text-[#9a919f]">{item.notes}</p>}
      </div>
      <div className="shrink-0">
        <ScheduleItemMenu
          sessionId={sessionId}
          item={item}
          onEdit={() => setIsEditing(true)}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
        />
      </div>
    </li>
  );
}

function DuplicateDayForm({ sessionId, sourceDate }: { sessionId: string; sourceDate: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-[#5b2a86] hover:underline"
      >
        <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
        Duplikuj dzień
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setError(null);
        try {
          await duplicateScheduleDay(formData);
          setOpen(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Nie udało się zduplikować dnia.");
        }
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="source_date" value={sourceDate} />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#706878]">Nowa data</label>
        <input name="target_date" type="date" required className="h-8 rounded-[10px] border border-[#e8e2ec] px-2 text-sm" />
      </div>
      <button type="submit" className="h-8 rounded-[10px] bg-[#5b2a86] px-3 text-xs font-medium text-white hover:bg-[#32134f]">
        Kopiuj
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="h-8 rounded-[10px] border border-[#e8e2ec] px-3 text-xs text-[#706878]"
      >
        Anuluj
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

export default function SessionScheduleTab({
  sessionId,
  items,
}: {
  sessionId: string;
  items: SessionScheduleItem[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const days = useMemo(() => {
    const map = new Map<string, SessionScheduleItem[]>();
    for (const item of items) {
      const list = map.get(item.item_date) ?? [];
      list.push(item);
      map.set(item.item_date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const totalHours = items.reduce((sum, item) => sum + (item.hours ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#201a2b]">Plan zajęć</h2>
            <p className="mt-0.5 text-xs text-[#706878]">
              {days.length} {days.length === 1 ? "dzień" : "dni"} · {formatHours(totalHours)} łącznie
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              title="Eksport ICS jest w przygotowaniu"
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 text-sm text-[#9a919f] opacity-60"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              ICS
            </button>
            <button
              type="button"
              disabled
              title="Eksport PDF jest w przygotowaniu"
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 text-sm text-[#9a919f] opacity-60"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              PDF
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="rounded-[10px] border border-[#e8e2ec] px-3 py-2 text-sm text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
            >
              {showAddForm ? "Anuluj" : "+ Dodaj punkt planu"}
            </button>
          </div>
        </div>

        {showAddForm && (
          <form
            ref={formRef}
            action={async (formData) => {
              setAddError(null);
              try {
                await addScheduleItem(formData);
                formRef.current?.reset();
                setShowAddForm(false);
              } catch (err) {
                setAddError(err instanceof Error ? err.message : "Nie udało się dodać punktu planu.");
              }
            }}
            className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
          >
            <input type="hidden" name="session_id" value={sessionId} />
            <ScheduleItemFields />
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <SubmitButton label="Dodaj punkt planu" pendingLabel="Dodawanie…" />
          </form>
        )}
      </section>

      {days.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={CalendarDays}
            title="Brak punktów planu"
            subtitle="Dodaj pierwszy punkt, żeby zbudować oś dnia."
            action={{ label: "Dodaj punkt planu", onClick: () => setShowAddForm(true) }}
          />
        </section>
      ) : (
        days.map(([date, dayItems]) => {
          const dayHours = dayItems.reduce((sum, item) => sum + (item.hours ?? 0), 0);
          return (
            <section
              key={date}
              className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-[#201a2b]">
                    {formatWeekdayDate(date)}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#706878]">{formatHours(dayHours)} tego dnia</p>
                </div>
                <DuplicateDayForm sessionId={sessionId} sourceDate={date} />
              </div>

              <ul className="mt-4">
                {dayItems.map((item, index) => (
                  <ScheduleItemRow
                    key={item.id}
                    sessionId={sessionId}
                    item={item}
                    canMoveUp={index > 0}
                    canMoveDown={index < dayItems.length - 1}
                  />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
