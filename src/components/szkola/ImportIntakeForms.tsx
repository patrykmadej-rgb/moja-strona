"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Loader2, Mail, Paperclip } from "lucide-react";
import { createImportFromPastedEmail, createImportFromUpload } from "@/app/lab/szkola/import/actions";
import { uploadImportFile } from "@/lib/szkola/importStorage";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

type Mode = null | "upload" | "eml" | "paste" | "email-config";

export default function ImportIntakeForms() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emlInputRef = useRef<HTMLInputElement>(null);
  const pasteFormRef = useRef<HTMLFormElement>(null);

  const handleFileSelected = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const { storagePath, mimeType } = await uploadImportFile(file);
      const formData = new FormData();
      formData.set("storage_path", storagePath);
      formData.set("mime_type", mimeType);
      formData.set("original_filename", file.name);
      formData.set("file_size", String(file.size));
      const result = await createImportFromUpload(formData);
      router.push(`/lab/szkola/import/${result.inboxItemId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się przesłać pliku.");
    } finally {
      setIsUploading(false);
      setMode(null);
    }
  };

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFileSelected(file);
          }}
        />
        <input
          ref={emlInputRef}
          type="file"
          accept=".eml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFileSelected(file);
          }}
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <CloudUpload className="h-4 w-4" strokeWidth={1.75} />}
          {isUploading ? "Przetwarzanie…" : "Prześlij plik"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "paste" ? null : "paste")}
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd]"
        >
          <Mail className="h-4 w-4" strokeWidth={1.75} />
          Wklej treść wiadomości
        </button>

        <button
          type="button"
          disabled={isUploading}
          onClick={() => emlInputRef.current?.click()}
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-50"
        >
          <Paperclip className="h-4 w-4" strokeWidth={1.75} />
          Importuj plik EML
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "email-config" ? null : "email-config")}
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-sm text-[#706878] hover:border-[#d9cde5] hover:bg-[#f7f4ef]"
        >
          Konfiguracja skrzynki e-mail
        </button>
      </div>

      <p className="mt-3 text-xs text-[#9a919f]">PDF, JPG, PNG, WEBP, DOCX, TXT, EML — maks. 25 MB.</p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {mode === "paste" && (
        <form
          ref={pasteFormRef}
          action={async (formData) => {
            setError(null);
            setIsUploading(true);
            try {
              const result = await createImportFromPastedEmail(formData);
              router.push(`/lab/szkola/import/${result.inboxItemId}`);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się zapisać wiadomości.");
              setIsUploading(false);
            }
          }}
          className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
        >
          <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Nadawca</label>
              <input name="sender_name" placeholder="np. Szkoła Psychoterapii" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Data</label>
              <input name="received_at" type="date" className={inputClass} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Temat</label>
            <input name="subject" placeholder="Temat wiadomości" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Treść</label>
            <textarea name="body" required rows={6} placeholder="Wklej treść wiadomości…" className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isUploading}
              className="rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white hover:bg-[#32134f] disabled:opacity-50"
            >
              {isUploading ? "Przetwarzanie…" : "Importuj wiadomość"}
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#706878] hover:border-[#d9cde5]"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      {mode === "email-config" && (
        <div className="mt-4 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4 text-sm text-[#4f4758]">
          <p className="font-medium text-[#201a2b]">Dedykowany adres e-mail (opcjonalne, przyszłościowe)</p>
          <p className="mt-2 text-xs leading-relaxed text-[#706878]">
            Automatyczne przyjmowanie wiadomości wysłanych np. na <code className="rounded bg-white px-1 py-0.5">rezerwacje@patrykmadej.com</code>{" "}
            wymaga zewnętrznego dostawcy inbound e-mail (np. Postmark, SendGrid Inbound Parse, Mailgun Routes) skonfigurowanego
            na przekazywanie wiadomości pod webhook tej aplikacji. Ta funkcja NIE jest jeszcze aktywna — nie wybrano
            dostawcy bez Twojej decyzji. Do czasu konfiguracji korzystaj z „Wklej treść wiadomości” lub „Importuj plik EML”
            (pobrany ręcznie z klienta poczty), które działają już teraz w pełni.
          </p>
        </div>
      )}
    </section>
  );
}
