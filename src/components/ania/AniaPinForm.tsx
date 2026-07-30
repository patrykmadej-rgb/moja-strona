"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AniaPinForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ania/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        setError("Nieprawidłowy PIN.");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Coś poszło nie tak. Spróbuj ponownie.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        Generator grafik
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Podaj PIN, aby uzyskać dostęp.
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pin" className="text-sm font-medium">
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !pin}
        className="mt-2 rounded-full bg-[#4A1D6E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4A2073] disabled:opacity-50 dark:hover:bg-[#7B4DB8]"
      >
        {loading ? "Sprawdzanie..." : "Wejdź"}
      </button>
    </form>
  );
}
