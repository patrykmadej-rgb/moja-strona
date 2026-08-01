"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { getDocumentDownloadUrl } from "@/lib/szkola/documentsStorage";
import { formatBytes } from "@/lib/lab/format";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  RELATED_ENTITY_TYPE_LABELS,
  type DocumentType,
  type SchoolSession,
  type SessionDocument,
} from "@/lib/szkola/types";

export default function DocumentsExplorer({
  sessions,
  documents,
}: {
  sessions: SchoolSession[];
  documents: SessionDocument[];
}) {
  const [sessionFilter, setSessionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "">("");
  const [yearFilter, setYearFilter] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);
  const trainingYears = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.training_year).filter(Boolean))).sort(),
    [sessions],
  ) as string[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (sessionFilter && d.session_id !== sessionFilter) return false;
      if (typeFilter && d.doc_type !== typeFilter) return false;
      if (yearFilter && sessionsById.get(d.session_id)?.training_year !== yearFilter) return false;
      if (q && !(d.title ?? d.name).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documents, sessionFilter, typeFilter, yearFilter, query, sessionsById]);

  const handleOpen = async (document: SessionDocument) => {
    setError(null);
    try {
      if (!document.storage_path) return;
      const url = await getDocumentDownloadUrl(document.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się otworzyć dokumentu.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-[300px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj dokumentu…"
            className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none focus:border-[#5b2a86]"
          />
        </div>
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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DocumentType | "")}
          aria-label="Filtruj po typie dokumentu"
          className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
        >
          <option value="">Wszystkie typy</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        {trainingYears.length > 0 && (
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            aria-label="Filtruj po roku szkoleniowym"
            className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
          >
            <option value="">Wszystkie lata</option>
            {trainingYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {filtered.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={FileText}
            title={documents.length === 0 ? "Brak dokumentów" : "Nic nie pasuje do filtrów"}
            subtitle={documents.length === 0 ? "Wgraj dokumenty w widoku danego zjazdu." : "Zmień wyszukiwanie lub filtry."}
          />
        </section>
      ) : (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <ul>
            {filtered.map((document) => {
              const session = sessionsById.get(document.session_id);
              return (
                <li key={document.id} className="flex items-center justify-between gap-4 border-b border-[#eee9f2] py-4 last:border-b-0">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd]">
                      <FileText className="h-4 w-4 text-[#5b2a86]" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => handleOpen(document)}
                        className="truncate text-left text-sm font-medium text-[#201a2b] hover:text-[#5b2a86] hover:underline"
                      >
                        {document.title ?? document.name}
                      </button>
                      <p className="mt-0.5 truncate text-xs text-[#706878]">
                        {[
                          DOCUMENT_TYPE_LABELS[document.doc_type],
                          document.document_date,
                          document.file_size ? formatBytes(document.file_size) : null,
                          document.related_entity_type ? RELATED_ENTITY_TYPE_LABELS[document.related_entity_type] : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {session && (
                        <Link
                          href={`/lab/szkola/zjazdy/${session.id}`}
                          className="mt-1 inline-block truncate text-xs text-[#5b2a86] hover:underline"
                        >
                          {session.title} →
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
