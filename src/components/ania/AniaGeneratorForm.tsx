"use client";

import { useState, type FormEvent } from "react";

export default function AniaGeneratorForm() {
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setImage(null);

    try {
      const res = await fetch("/api/ania/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, text }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Nie udało się wygenerować grafiki. Spróbuj ponownie za chwilę.");
        setErrorDetails(data?.details ?? null);
        return;
      }

      setImage(data.image);
    } catch (err) {
      setError("Nie udało się wygenerować grafiki. Spróbuj ponownie za chwilę.");
      setErrorDetails(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
          Generator grafik LinkedIn
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Wpisz temat i dokładny tekst — narzędzie wygeneruje grafikę w stylu edytorialskim.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="topic" className="text-sm font-medium">
            Temat / koncepcja
          </label>
          <textarea
            id="topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            rows={2}
            placeholder="np. utrata kontroli nad budżetem projektu"
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="text" className="text-sm font-medium">
            Dokładny tekst na grafice
          </label>
          <textarea
            id="text"
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={3}
            placeholder="np. This is not a cost problem. It's a loss of leadership capacity."
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !topic || !text}
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#4A1D6E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4A2073] disabled:opacity-50 dark:hover:bg-[#7B4DB8]"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Generowanie... to może potrwać 15-30 sekund
            </>
          ) : (
            "Generuj grafikę"
          )}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <p>{error}</p>
          {errorDetails && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errorDetails}</p>
          )}
        </div>
      )}

      {image && (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Wygenerowana grafika"
            className="w-full border border-neutral-200 dark:border-neutral-800"
          />
          <a
            href={image}
            download="grafika-ania.png"
            className="self-start rounded-full bg-[#4A1D6E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
          >
            Pobierz grafikę
          </a>
        </div>
      )}
    </div>
  );
}
