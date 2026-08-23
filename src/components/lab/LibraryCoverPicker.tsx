"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import LibraryCoverImage from "@/components/lab/LibraryCoverImage";

export type CoverCandidate = {
  id: string;
  title: string | null;
  author: string | null;
  publisher: string | null;
  year: number | null;
  isbn: string | null;
  thumbnailUrl: string;
};

type SearchStatus = "idle" | "loading" | "done" | "error";

/**
 * Sekcja 7 briefu: JEDEN wspólny komponent wyszukiwania/wyboru okładki,
 * reużywany w formularzu dodawania/edycji (LibraryBookFormModal), w
 * dodawaniu ze zdjęcia (LibraryPhotoAddModal, po jednej instancji na
 * propozycję) i w samodzielnym "Znajdź okładkę" z menu istniejącej
 * książki (LibraryCoverPickerModal) — żeby nie było drugiej, konkurencyjnej
 * integracji z Google Books. Szuka automatycznie (z debounce) gdy tytuł i
 * autor są wypełnione i nie ma jeszcze wyniku dla tej dokładnej pary.
 */
export default function LibraryCoverPicker({
  title,
  author,
  selected,
  onSelect,
  autoSearch = true,
}: {
  title: string;
  author: string;
  selected: CoverCandidate | null;
  onSelect: (candidate: CoverCandidate | null) => void;
  autoSearch?: boolean;
}) {
  const [candidates, setCandidates] = useState<CoverCandidate[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [pickerOpen, setPickerOpen] = useState(false);
  const lastQueryRef = useRef<string>("");
  // Jeśli komponent startuje z już wybraną okładką (edycja istniejącej
  // książki, albo poprzedni wybór użytkownika) — NIE nadpisuj jej
  // automatycznie pierwszym wynikiem wyszukiwania. Wartość początkowa
  // liczona raz przy montowaniu (celowo referencja do propsa `selected`
  // z pierwszego renderu, nie efekt).
  const autoPickedRef = useRef(selected !== null);

  const runSearch = useCallback(
    async (searchTitle: string, searchAuthor: string) => {
      if (!searchTitle) return;
      setStatus("loading");
      try {
        const params = new URLSearchParams({ title: searchTitle });
        if (searchAuthor) params.set("author", searchAuthor);
        const res = await fetch(`/api/lab/biblioteka/cover-search?${params.toString()}`);
        const json = (await res.json()) as { candidates?: CoverCandidate[] };
        const found = json.candidates ?? [];
        setCandidates(found);
        setStatus("done");
        // Jeśli dostępna jedna odpowiednia okładka (albo kilka) — wybierz
        // automatycznie pierwszą (najlepiej dopasowaną wg Google Books),
        // ale TYLKO raz na propozycję i tylko gdy użytkownik jeszcze
        // niczego sam nie wybrał.
        if (found.length > 0 && !autoPickedRef.current) {
          autoPickedRef.current = true;
          onSelect(found[0]);
        }
      } catch {
        setStatus("error");
      }
    },
    [onSelect],
  );

  useEffect(() => {
    if (!autoSearch) return;
    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    if (!cleanTitle) return;

    const key = `${cleanTitle}|${cleanAuthor}`;
    if (key === lastQueryRef.current) return;

    const timer = setTimeout(() => {
      lastQueryRef.current = key;
      void runSearch(cleanTitle, cleanAuthor);
    }, 700);
    return () => clearTimeout(timer);
  }, [title, author, autoSearch, runSearch]);

  const handleManualSearch = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    lastQueryRef.current = `${cleanTitle}|${author.trim()}`;
    void runSearch(cleanTitle, author.trim());
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <LibraryCoverImage url={selected?.thumbnailUrl ?? null} />
        <div className="flex min-w-0 flex-col gap-1">
          {status === "loading" && (
            <p className="flex items-center gap-1.5 text-xs text-[#706878]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
              Szukam okładki…
            </p>
          )}
          {status === "done" && candidates.length === 0 && (
            <p className="text-xs text-[#9a919f]">Nie znaleziono okładki — możesz zapisać książkę bez niej.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {candidates.length > 0 ? (
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="rounded-[8px] border border-[#e6deec] px-3 py-1.5 text-xs font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
              >
                {selected ? "Zmień okładkę" : "Wybierz okładkę"}
              </button>
            ) : (
              status !== "loading" && (
                <button
                  type="button"
                  onClick={handleManualSearch}
                  disabled={!title.trim()}
                  className="flex items-center gap-1.5 rounded-[8px] border border-[#e6deec] px-3 py-1.5 text-xs font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                  Szukaj okładki
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {pickerOpen && candidates.length > 0 && (
        <div role="listbox" aria-label="Dostępne okładki" className="flex flex-wrap gap-2 rounded-[10px] border border-[#e8e2ec] bg-[#faf8fc] p-2.5">
          {candidates.map((c) => {
            const isSelected = selected?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(c);
                  setPickerOpen(false);
                }}
                className={
                  isSelected
                    ? "rounded-[8px] ring-2 ring-[#5b2a86] ring-offset-2 ring-offset-[#faf8fc]"
                    : "rounded-[8px] opacity-80 transition-opacity hover:opacity-100"
                }
                title={[c.title, c.publisher].filter(Boolean).join(" — ") || undefined}
              >
                <LibraryCoverImage url={c.thumbnailUrl} size="small" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
