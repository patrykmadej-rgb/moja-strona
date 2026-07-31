"use client";

import { useState } from "react";
import type { Article } from "@/lib/lab/types";

const ABSTRACT_PREVIEW_LENGTH = 320;

function FieldValue({ value }: { value: string | null }) {
  if (!value) {
    return <dd className="mt-1 text-sm italic text-[#706878]">Nie określono</dd>;
  }
  return <dd className="mt-1 text-sm text-[#201a2b]">{value}</dd>;
}

export default function ArticleBasicInfoCard({ article }: { article: Article }) {
  const [abstractExpanded, setAbstractExpanded] = useState(false);
  const abstract = article.abstract?.trim() || null;
  const abstractIsLong = (abstract?.length ?? 0) > ABSTRACT_PREVIEW_LENGTH;
  const abstractText =
    abstract && abstractIsLong && !abstractExpanded
      ? `${abstract.slice(0, ABSTRACT_PREVIEW_LENGTH).trimEnd()}…`
      : abstract;

  return (
    <section className="rounded-[14px] border border-[#e8e2ec] bg-white/95 p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Informacje podstawowe</h2>

      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[#706878]">Język</dt>
          <FieldValue value={article.language} />
        </div>
        <div>
          <dt className="text-xs text-[#706878]">Docelowe czasopismo</dt>
          <FieldValue value={article.target_journal} />
        </div>
        <div>
          <dt className="text-xs text-[#706878]">Dyscyplina</dt>
          <FieldValue value={article.discipline} />
        </div>
        <div>
          <dt className="text-xs text-[#706878]">Typ publikacji</dt>
          <FieldValue value={null} />
        </div>
      </dl>

      <div className="mt-4">
        <dt className="text-xs text-[#706878]">Słowa kluczowe</dt>
        {article.keywords.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {article.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-[#f1edf5] px-2.5 py-1 text-xs text-[#53455d]"
              >
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm italic text-[#706878]">Nie dodano słów kluczowych</p>
        )}
      </div>

      <div className="mt-4 border-t border-[#e8e2ec] pt-4">
        <dt className="text-xs text-[#706878]">Abstrakt</dt>
        {abstract ? (
          <>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#201a2b]">
              {abstractText}
            </p>
            {abstractIsLong && (
              <button
                type="button"
                onClick={() => setAbstractExpanded((v) => !v)}
                className="mt-2 text-sm font-medium text-[#5b2a86] hover:underline"
              >
                {abstractExpanded ? "Pokaż mniej" : "Pokaż więcej"}
              </button>
            )}
          </>
        ) : (
          <p className="mt-1.5 text-sm italic text-[#706878]">Nie dodano abstraktu</p>
        )}
      </div>
    </section>
  );
}
