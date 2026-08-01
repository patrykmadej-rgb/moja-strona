"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { File, FileText, Image as ImageIcon, Link2, Search, StickyNote } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { getMaterialDownloadUrl } from "@/lib/szkola/materialsStorage";
import { formatBytes, formatDateTime } from "@/lib/lab/format";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_LABELS,
  type MaterialCategory,
  type SchoolSession,
  type SessionMaterial,
} from "@/lib/szkola/types";

function MaterialIcon({ material }: { material: SessionMaterial }) {
  const className = "h-5 w-5 text-[#5b2a86]";
  if (material.material_type === "link") return <Link2 className={className} strokeWidth={1.75} />;
  if (material.material_type === "notatka") return <StickyNote className={className} strokeWidth={1.75} />;
  if (material.file_type?.startsWith("image/")) return <ImageIcon className={className} strokeWidth={1.75} />;
  if (material.file_type === "application/pdf") return <FileText className={className} strokeWidth={1.75} />;
  return <File className={className} strokeWidth={1.75} />;
}

export default function MaterialsExplorer({
  sessions,
  materials,
}: {
  sessions: SchoolSession[];
  materials: SessionMaterial[];
}) {
  const [sessionFilter, setSessionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | "">("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const trainingYears = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.training_year).filter(Boolean))).sort(),
    [sessions],
  ) as string[];
  const [yearFilter, setYearFilter] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials.filter((m) => {
      if (sessionFilter && m.session_id !== sessionFilter) return false;
      if (categoryFilter && m.category !== categoryFilter) return false;
      if (yearFilter && sessionsById.get(m.session_id)?.training_year !== yearFilter) return false;
      if (q) {
        const matchesQuery =
          (m.title ?? m.name).toLowerCase().includes(q) ||
          (m.description ?? "").toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [materials, sessionFilter, categoryFilter, yearFilter, query, sessionsById]);

  const handleOpen = async (material: SessionMaterial) => {
    setError(null);
    try {
      if (material.material_type === "link" && material.external_link) {
        window.open(material.external_link, "_blank", "noopener,noreferrer");
        return;
      }
      if (material.storage_path) {
        const url = await getMaterialDownloadUrl(material.storage_path);
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się otworzyć materiału.");
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
            placeholder="Szukaj materiału…"
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as MaterialCategory | "")}
          aria-label="Filtruj po kategorii"
          className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
        >
          <option value="">Wszystkie kategorie</option>
          {MATERIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {MATERIAL_CATEGORY_LABELS[c]}
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
            icon={File}
            title={materials.length === 0 ? "Brak materiałów" : "Nic nie pasuje do filtrów"}
            subtitle={materials.length === 0 ? "Dodaj materiały w widoku danego zjazdu." : "Zmień wyszukiwanie lub filtry."}
          />
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[700px]:grid-cols-2">
          {filtered.map((material) => {
            const session = sessionsById.get(material.session_id);
            return (
              <div key={material.id} className="rounded-[14px] border border-[#e8e2ec] bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd]">
                    <MaterialIcon material={material} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleOpen(material)}
                      className="truncate text-left text-sm font-medium text-[#201a2b] hover:text-[#5b2a86] hover:underline"
                    >
                      {material.title ?? material.name}
                    </button>
                    <p className="mt-0.5 truncate text-xs text-[#706878]">
                      {[
                        material.category ? MATERIAL_CATEGORY_LABELS[material.category] : null,
                        material.file_size ? formatBytes(material.file_size) : null,
                        formatDateTime(material.created_at),
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
