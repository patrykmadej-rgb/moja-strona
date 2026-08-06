"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { GraduationCap } from "lucide-react";
import { createSemester, deleteSemester, updateSemester } from "@/app/lab/szkola/semestry/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatMoney } from "@/lib/szkola/money";
import { formatDateOnly } from "@/lib/lab/format";
import { CURRENCIES, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, type SchoolSemester } from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

function statusColor(status: SchoolSemester["payment_status"]): string {
  if (status === "oplacone") return "bg-[#e5f6eb] text-[#2f7a4c]";
  if (status === "po_terminie") return "bg-[#fbe9ea] text-[#a13d47]";
  if (status === "anulowane") return "bg-[#efedf0] text-[#6f6874]";
  return "bg-[#fff2d9] text-[#a76616]";
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

function SemesterFields({ semester }: { semester?: SchoolSemester }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nazwa *</label>
          <input name="name" required placeholder="np. Semestr zimowy 2026" defaultValue={semester?.name ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Status płatności</label>
          <select name="payment_status" defaultValue={semester?.payment_status ?? "do_zaplaty"} className={inputClass}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data rozpoczęcia *</label>
          <input name="start_date" type="date" required defaultValue={semester?.start_date ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data zakończenia</label>
          <input name="end_date" type="date" defaultValue={semester?.end_date ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_90px]">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Kwota</label>
          <input name="amount" type="number" min={0} step="0.01" defaultValue={semester?.amount ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Waluta</label>
          <select name="currency" defaultValue={semester?.currency ?? "PLN"} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Termin płatności</label>
          <input name="payment_due_date" type="date" defaultValue={semester?.payment_due_date ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data opłacenia</label>
          <input name="paid_at" type="date" defaultValue={semester?.paid_at ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Notatka</label>
        <textarea name="notes" rows={2} defaultValue={semester?.notes ?? ""} className={inputClass} />
      </div>
    </>
  );
}

function SemesterRow({ semester, sessionCount }: { semester: SchoolSemester; sessionCount: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isEditing) {
    return (
      <li className="border-b border-[#eee9f2] py-4 last:border-b-0">
        <form
          action={async (formData) => {
            setError(null);
            try {
              await updateSemester(formData);
              setIsEditing(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się zapisać semestru.");
            }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="id" value={semester.id} />
          <SemesterFields semester={semester} />
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

  return (
    <li className="flex items-center justify-between gap-4 border-b border-[#eee9f2] py-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd] text-[#5b2a86]">
          <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#201a2b]">
            {semester.name}
            {semester.amount != null && ` · ${formatMoney(semester.amount, semester.currency)}`}
          </p>
          <p className="mt-0.5 truncate text-xs text-[#706878]">
            {[
              formatDateOnly(semester.start_date) + (semester.end_date ? ` – ${formatDateOnly(semester.end_date)}` : ""),
              `${sessionCount} ${sessionCount === 1 ? "zjazd" : "zjazdów"}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColor(semester.payment_status)}`}>
        {PAYMENT_STATUS_LABELS[semester.payment_status]}
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" onClick={() => setIsEditing(true)} className="text-sm text-[#5b2a86] hover:underline">
          Edytuj
        </button>
        <form
          action={deleteSemester}
          onSubmit={(e) => {
            const confirmMessage =
              sessionCount > 0
                ? `Usunąć semestr „${semester.name}”? ${sessionCount} ${sessionCount === 1 ? "przypisany zjazd" : "przypisanych zjazdów"} straci przypisanie (status płatności wróci do „brak danych”).`
                : `Usunąć semestr „${semester.name}”?`;
            if (!confirm(confirmMessage)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={semester.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Usuń
          </button>
        </form>
      </div>
    </li>
  );
}

export default function SemestersExplorer({
  semesters,
  sessionCounts,
}: {
  semesters: SchoolSemester[];
  sessionCounts: Record<string, number>;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#201a2b]">Semestry</h2>
          <p className="mt-1 text-xs text-[#706878]">
            Szkoła jest opłacana semestralnie z góry — przypisz zjazdy do semestru (w edycji zjazdu), żeby „Status
            przygotowań” mógł automatycznie pokazywać status opłaty.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="shrink-0 rounded-[10px] border border-[#e8e2ec] px-3 py-1.5 text-sm text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
        >
          {showAddForm ? "Anuluj" : "+ Dodaj semestr"}
        </button>
      </div>

      {showAddForm && (
        <form
          ref={formRef}
          action={async (formData) => {
            setError(null);
            try {
              await createSemester(formData);
              formRef.current?.reset();
              setShowAddForm(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się dodać semestru.");
            }
          }}
          className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
        >
          <SemesterFields />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton label="Dodaj semestr" pendingLabel="Dodawanie…" />
        </form>
      )}

      <div className="mt-4">
        {semesters.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Brak semestrów"
            subtitle="Dodaj pierwszy semestr, żeby móc śledzić opłatę za szkołę i przypisywać do niego zjazdy."
            action={{ label: "Dodaj semestr", onClick: () => setShowAddForm(true) }}
            compact
          />
        ) : (
          <ul>
            {semesters.map((semester) => (
              <SemesterRow key={semester.id} semester={semester} sessionCount={sessionCounts[semester.id] ?? 0} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
