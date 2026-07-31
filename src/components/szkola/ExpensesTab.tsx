"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Receipt } from "lucide-react";
import { addExpense, deleteExpense, updateExpense } from "@/app/lab/szkola/zjazdy/[id]/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatMoney } from "@/lib/szkola/money";
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUSES,
  EXPENSE_STATUS_LABELS,
  type Expense,
} from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

function statusColor(status: Expense["status"]): string {
  if (status === "oplacony" || status === "zwrocony") return "bg-[#e5f6eb] text-[#2f7a4c]";
  if (status === "do_zwrotu") return "bg-[#eaf0ff] text-[#3564bd]";
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

function ExpenseFields({ expense }: { expense?: Expense }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Nazwa *</label>
        <input name="name" required defaultValue={expense?.name ?? ""} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Kategoria</label>
          <select name="category" defaultValue={expense?.category ?? "inne"} className={inputClass}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={expense?.status ?? "zaplanowany"} className={inputClass}>
            {EXPENSE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {EXPENSE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_90px_1fr]">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Kwota *</label>
          <input
            name="amount"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={expense?.amount ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Waluta</label>
          <select name="currency" defaultValue={expense?.currency ?? "PLN"} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data</label>
          <input name="expense_date" type="date" defaultValue={expense?.expense_date ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Sposób płatności</label>
          <input name="payment_method" defaultValue={expense?.payment_method ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nr dokumentu</label>
          <input name="document_number" defaultValue={expense?.document_number ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Notatka</label>
        <textarea name="notes" rows={2} defaultValue={expense?.notes ?? ""} className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-[#201a2b]">
        <input
          type="checkbox"
          name="has_invoice"
          defaultChecked={expense?.has_invoice ?? false}
          className="h-4 w-4 accent-[#5b2a86]"
        />
        Mam fakturę / paragon
      </label>
    </>
  );
}

function ExpenseRow({ sessionId, expense }: { sessionId: string; expense: Expense }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isEditing) {
    return (
      <li className="border-b border-[#eee9f2] py-4 last:border-b-0">
        <form
          action={async (formData) => {
            setError(null);
            try {
              await updateExpense(formData);
              setIsEditing(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się zapisać wydatku.");
            }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={expense.id} />
          <ExpenseFields expense={expense} />
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
          <Receipt className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#201a2b]">
            {expense.name} · {formatMoney(expense.amount, expense.currency)}
          </p>
          <p className="mt-0.5 truncate text-xs text-[#706878]">
            {[EXPENSE_CATEGORY_LABELS[expense.category], expense.expense_date, expense.has_invoice ? "faktura" : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColor(expense.status)}`}>
        {EXPENSE_STATUS_LABELS[expense.status]}
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" onClick={() => setIsEditing(true)} className="text-sm text-[#5b2a86] hover:underline">
          Edytuj
        </button>
        <form
          action={deleteExpense}
          onSubmit={(e) => {
            if (!confirm(`Usunąć wydatek „${expense.name}”?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={expense.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Usuń
          </button>
        </form>
      </div>
    </li>
  );
}

export default function ExpensesTab({ sessionId, expenses }: { sessionId: string; expenses: Expense[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[#201a2b]">Wydatki</h2>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-[10px] border border-[#e8e2ec] px-3 py-1.5 text-sm text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
          >
            {showAddForm ? "Anuluj" : "+ Dodaj wydatek"}
          </button>
        </div>

        {showAddForm && (
          <form
            ref={formRef}
            action={async (formData) => {
              setError(null);
              try {
                await addExpense(formData);
                formRef.current?.reset();
                setShowAddForm(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się dodać wydatku.");
              }
            }}
            className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
          >
            <input type="hidden" name="session_id" value={sessionId} />
            <ExpenseFields />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton label="Dodaj wydatek" pendingLabel="Dodawanie…" />
          </form>
        )}

        <div className="mt-4">
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Brak zarejestrowanych wydatków"
              subtitle="Dodaj koszt transportu, jedzenia lub inny wydatek podróżny."
              action={{ label: "Dodaj wydatek", onClick: () => setShowAddForm(true) }}
              compact
            />
          ) : (
            <ul>
              {expenses.map((expense) => (
                <ExpenseRow key={expense.id} sessionId={sessionId} expense={expense} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
