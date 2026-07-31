"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addNote, updateNote, deleteNote } from "@/app/lab/artykuly/[id]/actions";
import NotePinnedToggle from "@/components/lab/NotePinnedToggle";
import { formatDateTime } from "@/lib/lab/format";
import type { ArticleNote } from "@/lib/lab/types";

const textareaClass =
  "border border-[#4A1D6E]/25 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start bg-[#4A1D6E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4A2073] disabled:opacity-50"
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
      <li className="border-b-[0.5px] border-[#4A1D6E]/20 py-4">
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
              className="border border-[#4A1D6E]/25 px-4 py-2 text-sm text-[#4A3360] hover:border-[#4A1D6E]/50"
            >
              Anuluj
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="border-b-[0.5px] border-[#4A1D6E]/20 py-4">
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-[#1C1028]">{note.content}</p>
        <NotePinnedToggle articleId={articleId} noteId={note.id} isPinned={note.is_pinned} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="text-xs text-[#4A3360]">
          {formatDateTime(note.created_at)}
          {wasEdited ? " · edytowano" : ""}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-sm text-[#4A1D6E] hover:underline"
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
      <section className="border border-[#4A1D6E]/15 bg-white p-6">
        <h2 className="text-sm font-semibold text-[#1C1028]">Dodaj notatkę</h2>
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
          <div className="border border-[#4A1D6E]/15 bg-white px-6 py-10 text-center">
            <p className="text-sm text-[#4A3360]">Brak notatek — dodaj pierwszą powyżej.</p>
          </div>
        ) : (
          <ul>
            {orderedForList.map((note) => (
              <NoteCard key={note.id} articleId={articleId} note={note} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
