"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CloudUpload,
  Download,
  File,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import {
  addMaterialEntry,
  deleteMaterialFile,
  getMaterialDownloadUrl,
  uploadMaterialFile,
} from "@/lib/szkola/materialsStorage";
import { updateMaterialMeta } from "@/app/lab/szkola/zjazdy/[id]/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatBytes, formatDateTime } from "@/lib/lab/format";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_LABELS,
  type MaterialCategory,
  type SessionMaterial,
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

function MaterialIcon({ material }: { material: SessionMaterial }) {
  const className = "h-5 w-5 text-[#5b2a86]";
  if (material.material_type === "link") return <Link2 className={className} strokeWidth={1.75} />;
  if (material.material_type === "notatka") return <StickyNote className={className} strokeWidth={1.75} />;
  if (material.file_type?.startsWith("image/")) return <ImageIcon className={className} strokeWidth={1.75} />;
  if (material.file_type === "application/pdf") return <FileText className={className} strokeWidth={1.75} />;
  return <File className={className} strokeWidth={1.75} />;
}

function MaterialEditForm({
  sessionId,
  material,
  onClose,
}: {
  sessionId: string;
  material: SessionMaterial;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        try {
          await updateMaterialMeta(formData);
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Nie udało się zapisać materiału.");
        }
      }}
      className="mt-3 flex flex-col gap-2.5 border-t border-[#eee9f2] pt-3"
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="id" value={material.id} />
      <input name="title" required defaultValue={material.title ?? material.name} className={inputClass} />
      <select name="category" defaultValue={material.category ?? ""} className={inputClass}>
        <option value="">Bez kategorii</option>
        {MATERIAL_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {MATERIAL_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <input name="folder" placeholder="Folder (opcjonalnie)" defaultValue={material.folder ?? ""} className={inputClass} />
      <input name="author" placeholder="Prowadzący / autor" defaultValue={material.author ?? ""} className={inputClass} />
      <input
        name="tags"
        placeholder="Tagi oddzielone przecinkami"
        defaultValue={material.tags.join(", ")}
        className={inputClass}
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Opis"
        defaultValue={material.description ?? ""}
        className={inputClass}
      />
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

function MaterialCard({
  sessionId,
  material,
  onDeleted,
}: {
  sessionId: string;
  material: SessionMaterial;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = material.file_type?.startsWith("image/");

  useEffect(() => {
    if (isImage && material.storage_path) {
      getMaterialDownloadUrl(material.storage_path).then(setPreviewUrl).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material.storage_path]);

  const handleDelete = async () => {
    if (!confirm(`Usunąć materiał „${material.title ?? material.name}”?`)) return;
    setError(null);
    setIsDeleting(true);
    try {
      await deleteMaterialFile(material.id, material.storage_path);
      onDeleted(material.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć materiału.");
      setIsDeleting(false);
    }
  };

  const handleOpen = async () => {
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
    <div className="rounded-[14px] border border-[#e8e2ec] bg-white p-4">
      <div className="flex items-start gap-3">
        {isImage && previewUrl ? (
          <button
            type="button"
            onClick={handleOpen}
            className="h-12 w-12 shrink-0 overflow-hidden rounded-[10px] border border-[#e8e2ec] bg-[#f1eafd]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura z signed URL, poza optymalizacją next/image */}
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd]">
            <MaterialIcon material={material} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#201a2b]">{material.title ?? material.name}</p>
          <p className="mt-0.5 truncate text-xs text-[#706878]">
            {[
              material.category ? MATERIAL_CATEGORY_LABELS[material.category] : null,
              material.file_size ? formatBytes(material.file_size) : null,
              formatDateTime(material.created_at),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {material.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {material.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#f1edf5] px-2 py-0.5 text-[10px] text-[#53455d]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpen}
            title={material.material_type === "link" ? "Otwórz link" : "Pobierz"}
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

      {material.description && !isEditing && (
        <p className="mt-2 whitespace-pre-wrap text-xs text-[#706878]">{material.description}</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {isEditing && (
        <MaterialEditForm sessionId={sessionId} material={material} onClose={() => setIsEditing(false)} />
      )}
    </div>
  );
}

function AddLinkOrNoteForm({
  sessionId,
  type,
  onAdded,
  onClose,
}: {
  sessionId: string;
  type: "link" | "notatka";
  onAdded: (material: SessionMaterial) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setPending(true);
        const formData = new FormData(e.currentTarget);
        try {
          const material = await addMaterialEntry(sessionId, {
            materialType: type,
            title: String(formData.get("title") ?? "").trim(),
            externalLink: String(formData.get("external_link") ?? "").trim(),
            description: String(formData.get("description") ?? "").trim(),
          });
          onAdded(material);
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Nie udało się dodać.");
        } finally {
          setPending(false);
        }
      }}
      className="mt-4 flex flex-col gap-2.5 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
    >
      <input name="title" required placeholder="Tytuł" className={inputClass} />
      {type === "link" ? (
        <input name="external_link" type="url" required placeholder="https://…" className={inputClass} />
      ) : (
        <textarea name="description" rows={3} required placeholder="Treść notatki" className={inputClass} />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white hover:bg-[#32134f] disabled:opacity-50"
        >
          {pending ? "Dodawanie…" : "Dodaj"}
        </button>
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

export default function MaterialsTab({
  sessionId,
  materials: initialMaterials,
}: {
  sessionId: string;
  materials: SessionMaterial[];
}) {
  const [materials, setMaterials] = useState<SessionMaterial[]>(initialMaterials);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<MaterialCategory | "">("");
  const [addMode, setAddMode] = useState<"link" | "notatka" | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      setIsUploading(true);
      try {
        for (const file of Array.from(fileList)) {
          const material = await uploadMaterialFile(sessionId, file, {
            category: uploadCategory || null,
          });
          setMaterials((prev) => [material, ...prev]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się wgrać materiału.");
      } finally {
        setIsUploading(false);
      }
    },
    [sessionId, uploadCategory],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      if (event.dataTransfer.files?.length) handleUploadFiles(event.dataTransfer.files);
    },
    [handleUploadFiles],
  );

  const filtered = materials.filter((m) => {
    if (categoryFilter && m.category !== categoryFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.title ?? m.name).toLowerCase().includes(q) ||
      (m.description ?? "").toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[#201a2b]">Materiały ze zjazdu</h2>
          <div className="flex items-center gap-2">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as MaterialCategory | "")}
              aria-label="Kategoria dla wgrywanych plików"
              className="h-9 rounded-[10px] border border-[#e8e2ec] bg-white px-2.5 text-xs text-[#4f4758]"
            >
              <option value="">Bez kategorii</option>
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {MATERIAL_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddMode(addMode === "link" ? null : "link")}
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd]"
            >
              <Link2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Link
            </button>
            <button
              type="button"
              onClick={() => setAddMode(addMode === "notatka" ? null : "notatka")}
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd]"
            >
              <StickyNote className="h-3.5 w-3.5" strokeWidth={1.75} />
              Notatka
            </button>
          </div>
        </div>

        {addMode && (
          <AddLinkOrNoteForm
            sessionId={sessionId}
            type={addMode}
            onAdded={(m) => setMaterials((prev) => [m, ...prev])}
            onClose={() => setAddMode(null)}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const fileList = event.target.files;
            event.target.value = "";
            if (fileList?.length) handleUploadFiles(fileList);
          }}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          className={
            isDraggingOver
              ? "mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-[14px] border-2 border-dashed border-[#5b2a86] bg-[#f1eafd] px-6 py-8 text-center"
              : "mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-[14px] border-2 border-dashed border-[#d9cde5] bg-[#f1eafd] px-6 py-8 text-center"
          }
        >
          {isUploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-[#706878]" strokeWidth={1.5} />
          ) : (
            <CloudUpload className="h-7 w-7 text-[#706878]" strokeWidth={1.5} />
          )}
          <p className="text-sm text-[#706878]">
            {isUploading ? "Wgrywanie…" : "Przeciągnij pliki tutaj lub kliknij, aby wybrać (można wiele naraz)"}
          </p>
          <p className="text-xs text-[#706878]/70">PDF, DOCX, PPTX, JPG, PNG, WEBP, TXT — maks. 30 MB</p>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj materiału…"
            className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none focus:border-[#5b2a86]"
          />
        </div>
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
      </div>

      {filtered.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={File}
            title={materials.length === 0 ? "Brak materiałów" : "Nic nie pasuje do filtrów"}
            subtitle={materials.length === 0 ? "Wgraj pierwszy plik albo dodaj link." : "Zmień wyszukiwanie lub kategorię."}
          />
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[700px]:grid-cols-2">
          {filtered.map((material) => (
            <MaterialCard
              key={material.id}
              sessionId={sessionId}
              material={material}
              onDeleted={(id) => setMaterials((prev) => prev.filter((m) => m.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
