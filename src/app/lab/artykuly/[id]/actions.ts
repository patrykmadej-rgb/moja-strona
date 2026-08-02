"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ARTICLE_STATUSES, READING_STATUSES, EVENT_TYPES, type EventType } from "@/lib/lab/types";

const VERSIONS_BUCKET = "article-versions";

function requireArticleId(formData: FormData): string {
  const id = String(formData.get("article_id") ?? "");
  if (!id) throw new Error("Brak identyfikatora artykułu.");
  return id;
}

function parseOptionalHttpUrl(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${fieldLabel}: nieprawidłowy adres URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${fieldLabel}: dozwolone są tylko adresy http(s).`);
  }
  return parsed.toString();
}

export async function updateArticle(formData: FormData) {
  const supabase = await createClient();
  const id = requireArticleId(formData);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Tytuł jest wymagany.");

  const status = String(formData.get("status") ?? "pomysl");
  if (!ARTICLE_STATUSES.includes(status as (typeof ARTICLE_STATUSES)[number])) {
    throw new Error("Nieprawidłowy status.");
  }

  const progress_percent = Math.min(
    100,
    Math.max(0, Number(formData.get("progress_percent") ?? 0) || 0),
  );

  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const chatgpt_link = parseOptionalHttpUrl(String(formData.get("chatgpt_link") ?? ""), "Link do ChatGPT");

  const { error } = await supabase
    .from("articles")
    .update({
      title,
      language: String(formData.get("language") ?? "").trim() || null,
      target_journal: String(formData.get("target_journal") ?? "").trim() || null,
      discipline: String(formData.get("discipline") ?? "").trim() || null,
      abstract: String(formData.get("abstract") ?? "").trim() || null,
      keywords,
      status,
      progress_percent,
      next_step: String(formData.get("next_step") ?? "").trim() || null,
      deadline: String(formData.get("deadline") ?? "").trim() || null,
      is_private: formData.get("is_private") === "on",
      chatgpt_link,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${id}`);
  revalidatePath("/lab/artykuly");
}

export async function addVersion(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const articleId = requireArticleId(formData);
  const file = formData.get("file");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Wybierz plik do wgrania.");
  }

  const { data: maxRow } = await supabase
    .from("article_versions")
    .select("version_number")
    .eq("article_id", articleId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = (maxRow?.version_number ?? 0) + 1;
  const path = `${articleId}/${versionNumber}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(VERSIONS_BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream" });

  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("article_versions").insert({
    article_id: articleId,
    version_number: versionNumber,
    file_path: path,
    file_name: file.name,
    file_size_bytes: file.size,
    notes,
    uploaded_by: user.id,
  });

  if (insertError) throw new Error(insertError.message);

  await supabase
    .from("articles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", articleId);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function deleteVersion(formData: FormData) {
  const supabase = await createClient();
  const articleId = requireArticleId(formData);
  const versionId = String(formData.get("id") ?? "");
  const filePath = String(formData.get("file_path") ?? "");

  if (filePath) {
    await supabase.storage.from(VERSIONS_BUCKET).remove([filePath]);
  }

  const { error } = await supabase.from("article_versions").delete().eq("id", versionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function addSource(formData: FormData) {
  const supabase = await createClient();
  const articleId = requireArticleId(formData);

  const reading_status = String(formData.get("reading_status") ?? "do_przeczytania");
  if (!READING_STATUSES.includes(reading_status as (typeof READING_STATUSES)[number])) {
    throw new Error("Nieprawidłowy status przeczytania.");
  }

  const yearRaw = String(formData.get("year") ?? "").trim();

  const { error } = await supabase.from("article_sources").insert({
    article_id: articleId,
    author: String(formData.get("author") ?? "").trim() || null,
    title: String(formData.get("title") ?? "").trim() || null,
    year: yearRaw ? Number(yearRaw) : null,
    publisher_or_journal: String(formData.get("publisher_or_journal") ?? "").trim() || null,
    doi: String(formData.get("doi") ?? "").trim() || null,
    url: String(formData.get("url") ?? "").trim() || null,
    source_type: String(formData.get("source_type") ?? "").trim() || null,
    reading_status,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function updateSource(formData: FormData) {
  const supabase = await createClient();
  const articleId = requireArticleId(formData);
  const sourceId = String(formData.get("id") ?? "");

  const reading_status = String(formData.get("reading_status") ?? "do_przeczytania");
  if (!READING_STATUSES.includes(reading_status as (typeof READING_STATUSES)[number])) {
    throw new Error("Nieprawidłowy status przeczytania.");
  }

  const yearRaw = String(formData.get("year") ?? "").trim();

  const { error } = await supabase
    .from("article_sources")
    .update({
      author: String(formData.get("author") ?? "").trim() || null,
      title: String(formData.get("title") ?? "").trim() || null,
      year: yearRaw ? Number(yearRaw) : null,
      publisher_or_journal: String(formData.get("publisher_or_journal") ?? "").trim() || null,
      doi: String(formData.get("doi") ?? "").trim() || null,
      url: String(formData.get("url") ?? "").trim() || null,
      source_type: String(formData.get("source_type") ?? "").trim() || null,
      reading_status,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", sourceId);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function deleteSource(formData: FormData) {
  const supabase = await createClient();
  const articleId = requireArticleId(formData);
  const sourceId = String(formData.get("id") ?? "");

  const { error } = await supabase.from("article_sources").delete().eq("id", sourceId);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

function requireEventType(formData: FormData): EventType {
  const event_type = String(formData.get("event_type") ?? "milestone");
  if (!EVENT_TYPES.includes(event_type as EventType)) {
    throw new Error("Nieprawidłowy typ wydarzenia.");
  }
  return event_type as EventType;
}

export async function addEvent(formData: FormData) {
  const supabase = await createClient();
  const articleId = requireArticleId(formData);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Tytuł jest wymagany.");

  const event_type = requireEventType(formData);

  const event_date = String(formData.get("event_date") ?? "").trim();
  if (!event_date) throw new Error("Data jest wymagana.");

  const { error } = await supabase.from("article_events").insert({
    article_id: articleId,
    title,
    event_type,
    event_date,
    is_completed: formData.get("is_completed") === "on",
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function updateEvent(formData: FormData) {
  const supabase = await createClient();
  const articleId = requireArticleId(formData);
  const eventId = String(formData.get("id") ?? "");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Tytuł jest wymagany.");

  const event_type = requireEventType(formData);

  const event_date = String(formData.get("event_date") ?? "").trim();
  if (!event_date) throw new Error("Data jest wymagana.");

  const { error } = await supabase
    .from("article_events")
    .update({
      title,
      event_type,
      event_date,
      is_completed: formData.get("is_completed") === "on",
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();
  const articleId = requireArticleId(formData);
  const eventId = String(formData.get("id") ?? "");

  const { error } = await supabase.from("article_events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function addNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const articleId = requireArticleId(formData);
  const content = String(formData.get("content") ?? "").trim();
  if (!content) throw new Error("Treść notatki jest wymagana.");

  const { error } = await supabase.from("article_notes").insert({
    article_id: articleId,
    content,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function updateNote(formData: FormData) {
  const supabase = await createClient();
  const articleId = requireArticleId(formData);
  const noteId = String(formData.get("id") ?? "");

  const content = String(formData.get("content") ?? "").trim();
  if (!content) throw new Error("Treść notatki jest wymagana.");

  const { error } = await supabase
    .from("article_notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", noteId);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function deleteNote(formData: FormData) {
  const supabase = await createClient();
  const articleId = requireArticleId(formData);
  const noteId = String(formData.get("id") ?? "");

  const { error } = await supabase.from("article_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function toggleNotePinned(articleId: string, noteId: string, isPinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("article_notes")
    .update({ is_pinned: isPinned })
    .eq("id", noteId);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}

export async function toggleEventCompleted(
  articleId: string,
  eventId: string,
  isCompleted: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("article_events")
    .update({ is_completed: isCompleted })
    .eq("id", eventId);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/artykuly/${articleId}`);
}
