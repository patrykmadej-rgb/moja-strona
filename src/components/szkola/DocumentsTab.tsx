"use client";

import { useCallback, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Download, FileText, Loader2, Pencil, Search, Trash2, Upload } from "lucide-react";
import {
  deleteDocumentFile,
  getDocumentDownloadUrl,
  uploadDocumentFile,
} from "@/lib/szkola/documentsStorage";
import { updateDocumentMeta } from "@/app/lab/szkola/zjazdy/[id]/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatBytes } from "@/lib/lab/format";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  RELATED_ENTITY_TYPES,
  RELATED_ENTITY_TYPE_LABELS,
  type DocumentType,
  type SessionDocument,
} from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";

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

function DocumentEditForm({
  sessionId,
  document,
  onClose,
}: {
  sessionId: string;
  document: SessionDocument;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        try {
          await updateDocumentMeta(formData);
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Nie udało się zapisać dokumentu.");
        }
      }}
      className="mt-3 flex flex-col gap-2.5 border-t border-[#eee9f2] pt-3"
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="id" value={document.id} />
      <input name="title" required defaultValue={document.title ?? document.name} className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <select name="doc_type" defaultValue={document.doc_type} className={inputClass}>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <input name="document_date" type="date" defaultValue={document.document_date ?? ""} className={inputClass} />
      </div>
      <select name="related_entity_type" defaultValue={document.related_entity_type ?? ""} className={inputClass}>
        <option value="">Bez powiązania</option>
        {RELATED_ENTITY_TYPES.map((t) => (
          <option key={t} value={t}>
            {RELATED_ENTITY_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      <textarea name="notes" rows={2} placeholder="Notatka" defaultValue={document.notes ?? ""} className={inputClass} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <SubmitButton label="Zapisz" pendingLabel="Zapisywanie…" />
        <button
          type="button"
          onClick={onClose}
          className="rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#706878] hover:border-[#d9cde5]"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}

function DocumentCard({
  sessionId,
  document,
  onDeleted,
}: {
  sessionId: string;
  document: SessionDocument;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm(`Usunąć dokument „${document.title ?? document.name}”?`)) return;
    setError(null);
    setIsDeleting(true);
    try {
      await deleteDocumentFile(document.id, document.storage_path);
      onDeleted(document.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć dokumentu.");
      setIsDeleting(false);
    }
  };

  const handleOpen = async () => {
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
    <li className="border-b border-[#eee9f2] py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd]">
            <FileText className="h-4 w-4 text-[#5b2a86]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#201a2b]">{document.title ?? document.name}</p>
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
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpen}
            title="Pobierz / podgląd"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#5b2a86] hover:bg-[#f1eafd]"
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            title="Edytuj"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#706878] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Usuń"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {isEditing && <DocumentEditForm sessionId={sessionId} document={document} onClose={() => setIsEditing(false)} />}
    </li>
  );
}

export default function DocumentsTab({
  sessionId,
  documents: initialDocuments,
}: {
  sessionId: string;
  documents: SessionDocument[];
}) {
  const [documents, setDocuments] = useState<SessionDocument[]>(initialDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocumentType>("bilet");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);
      try {
        const document = await uploadDocumentFile(sessionId, file, { docType });
        setDocuments((prev) => [document, ...prev]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się wgrać dokumentu.");
      } finally {
        setIsUploading(false);
      }
    },
    [sessionId, docType],
  );

  const filtered = documents.filter((d) => {
    if (typeFilter && d.doc_type !== typeFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (d.title ?? d.name).toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[#201a2b]">Dokumenty</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              aria-label="Typ dokumentu do wgrania"
              className="h-9 rounded-[10px] border border-[#e8e2ec] bg-white px-2.5 text-xs text-[#4f4758]"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOCUMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Upload className="h-4 w-4" strokeWidth={1.75} />}
              {isUploading ? "Wgrywanie…" : "Wgraj dokument"}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) handleUpload(file);
          }}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-3 text-xs text-[#9a919f]">PDF, JPG, PNG, WEBP — maks. 20 MB.</p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj dokumentu…"
            className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none focus:border-[#5b2a86]"
          />
        </div>
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
      </div>

      {filtered.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={FileText}
            title={documents.length === 0 ? "Brak dokumentów" : "Nic nie pasuje do filtrów"}
            subtitle={documents.length === 0 ? "Wgraj pierwszy dokument." : "Zmień wyszukiwanie lub typ."}
          />
        </section>
      ) : (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <ul>
            {filtered.map((document) => (
              <DocumentCard
                key={document.id}
                sessionId={sessionId}
                document={document}
                onDeleted={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
