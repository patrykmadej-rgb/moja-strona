"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addNote, updateNote, deleteNote } from "@/app/lab/artykuly/[id]/actions";
import NotePinnedToggle from "@/components/lab/NotePinnedToggle";
import { formatDateTime } from "@/lib/lab/format";
import type { ArticleNote } from "@/lib/lab/types";

const textareaClass =
  "rounded-[10px] border border-[#e6deec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";

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

function NoteCard({ articleId, note }: { articleId: string; note: ArticleNote }) {
  const [isEditing, setIsEditing] = useState(false);
  const wasEdited = note.updated_at !== note.created_at;

  if (isEditing) {
    return (
      <li className="border-b border-[#e6deec] py-4">
        <form
          action={async (formData) => {
            await updateNote(formData);
            setIsEditing(false);
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="article_id" value={articleId} />
          <input type="hidden" name="id" value={note.id} />
          <textarea
            name="content"
            rows={4}
            required
            defaultValue={note.content}
            className={textareaClass}
          />
          <div className="flex gap-3">
            <SubmitButton label="Zapisz" pendingLabel="Zapisywanie…" />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-[10px] border border-[#e6deec] px-4 py-2 text-sm text-[#706878] hover:border-[#d9cde5]"
            >
              Anuluj
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="border-b border-[#e6deec] py-4">
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-[#201a2b]">{note.content}</p>
        <NotePinnedToggle articleId={articleId} noteId={note.id} isPinned={note.is_pinned} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="text-xs text-[#706878]">
          {formatDateTime(note.created_at)}
          {wasEdited ? " · edytowano" : ""}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-sm text-[#5b2a86] hover:underline"
          >
            Edytuj
          </button>
          <form
            action={deleteNote}
            onSubmit={(e) => {
              if (!confirm("Usunąć tę notatkę?")) e.preventDefault();
            }}
          >
            <input type="hidden" name="article_id" value={articleId} />
            <input type="hidden" name="id" value={note.id} />
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Usuń
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

export default function NotesTab({
  articleId,
  notes,
}: {
  articleId: string;
  notes: ArticleNote[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const pinned = notes
    .filter((n) => n.is_pinned)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const unpinned = notes
    .filter((n) => !n.is_pinned)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const orderedForList = [...pinned, ...unpinned];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e6deec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <h2 className="text-sm font-semibold text-[#201a2b]">Dodaj notatkę</h2>
        <form
          ref={formRef}
          action={async (formData) => {
            await addNote(formData);
            formRef.current?.reset();
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <input type="hidden" name="article_id" value={articleId} />
          <textarea
            name="content"
            rows={3}
            required
            placeholder="Luźna myśl, pomysł, coś do zapamiętania…"
            className={textareaClass}
          />
          <SubmitButton label="Dodaj notatkę" pendingLabel="Dodawanie…" />
        </form>
      </section>

      <section>
        {orderedForList.length === 0 ? (
          <div className="rounded-[16px] border border-[#e6deec] bg-white px-6 py-10 text-center shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            <p className="text-sm text-[#706878]">Brak notatek — dodaj pierwszą powyżej.</p>
          </div>
        ) : (
          <ul className="rounded-[16px] border border-[#e6deec] bg-white px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            {orderedForList.map((note) => (
              <NoteCard key={note.id} articleId={articleId} note={note} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
