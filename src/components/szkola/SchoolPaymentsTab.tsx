"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Banknote } from "lucide-react";
import { addPayment, deletePayment, updatePayment } from "@/app/lab/szkola/zjazdy/[id]/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatMoney } from "@/lib/szkola/money";
import {
  CURRENCIES,
  PAYMENT_CATEGORIES,
  PAYMENT_CATEGORY_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type SchoolPayment,
} from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

function statusColor(status: SchoolPayment["status"]): string {
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

function PaymentFields({ payment }: { payment?: SchoolPayment }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Kategoria</label>
          <select name="category" defaultValue={payment?.category ?? "oplata_za_zjazd"} className={inputClass}>
            {PAYMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PAYMENT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={payment?.status ?? "do_zaplaty"} className={inputClass}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_90px]">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Kwota *</label>
          <input
            name="amount"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={payment?.amount ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Waluta</label>
          <select name="currency" defaultValue={payment?.currency ?? "PLN"} className={inputClass}>
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
          <input name="due_date" type="date" defaultValue={payment?.due_date ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data opłacenia</label>
          <input name="paid_date" type="date" defaultValue={payment?.paid_date ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Sposób płatności</label>
          <input name="payment_method" defaultValue={payment?.payment_method ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nr dokumentu</label>
          <input name="document_number" defaultValue={payment?.document_number ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Notatka</label>
        <textarea name="notes" rows={2} defaultValue={payment?.notes ?? ""} className={inputClass} />
      </div>
    </>
  );
}

function PaymentRow({ sessionId, payment }: { sessionId: string; payment: SchoolPayment }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isEditing) {
    return (
      <li className="border-b border-[#eee9f2] py-4 last:border-b-0">
        <form
          action={async (formData) => {
            setError(null);
            try {
              await updatePayment(formData);
              setIsEditing(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się zapisać płatności.");
            }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={payment.id} />
          <PaymentFields payment={payment} />
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
          <Banknote className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#201a2b]">
            {PAYMENT_CATEGORY_LABELS[payment.category]} · {formatMoney(payment.amount, payment.currency)}
          </p>
          <p className="mt-0.5 truncate text-xs text-[#706878]">
            {[payment.due_date && `termin ${payment.due_date}`, payment.payment_method].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColor(payment.status)}`}>
        {PAYMENT_STATUS_LABELS[payment.status]}
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" onClick={() => setIsEditing(true)} className="text-sm text-[#5b2a86] hover:underline">
          Edytuj
        </button>
        <form
          action={deletePayment}
          onSubmit={(e) => {
            if (!confirm("Usunąć tę płatność?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={payment.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Usuń
          </button>
        </form>
      </div>
    </li>
  );
}

export default function SchoolPaymentsTab({
  sessionId,
  payments,
}: {
  sessionId: string;
  payments: SchoolPayment[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[#201a2b]">Płatności za szkołę</h2>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-[10px] border border-[#e8e2ec] px-3 py-1.5 text-sm text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
          >
            {showAddForm ? "Anuluj" : "+ Dodaj płatność"}
          </button>
        </div>

        {showAddForm && (
          <form
            ref={formRef}
            action={async (formData) => {
              setError(null);
              try {
                await addPayment(formData);
                formRef.current?.reset();
                setShowAddForm(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się dodać płatności.");
              }
            }}
            className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
          >
            <input type="hidden" name="session_id" value={sessionId} />
            <PaymentFields />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton label="Dodaj płatność" pendingLabel="Dodawanie…" />
          </form>
        )}

        <div className="mt-4">
          {payments.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="Brak zarejestrowanych płatności"
              subtitle="Dodaj opłatę za zjazd, ratę lub superwizję."
              action={{ label: "Dodaj płatność", onClick: () => setShowAddForm(true) }}
              compact
            />
          ) : (
            <ul>
              {payments.map((payment) => (
                <PaymentRow key={payment.id} sessionId={sessionId} payment={payment} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
