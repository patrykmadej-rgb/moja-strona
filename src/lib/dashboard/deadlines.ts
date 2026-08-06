import type { UpcomingDeadline } from "@/lib/dashboard/types";

const MAX_DEADLINES = 5;

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

/**
 * Sekcja 9 briefu: "Nadchodzące terminy" — łączy kilka źródeł w jedną
 * chronologiczną listę, pomija zdarzenia zakończone/przeszłe. "Import
 * wymagający przeglądu" celowo pominięty jako źródło — import_inbox_items
 * nie ma żadnego pola z terminem (potwierdzone researchem), więc nie ma
 * czego tu sortować.
 */
export function buildUpcomingDeadlines(input: {
  sessions: { id: string; title: string; session_number: number | null; start_date: string }[];
  segments: { id: string; departure_place: string | null; arrival_place: string | null; departure_date: string | null; departure_time: string | null; status: string }[];
  accommodations: { id: string; name: string; check_in: string | null; payment_status: string }[];
  semesters: { id: string; name: string; payment_due_date: string | null; payment_status: string }[];
  articles: { id: string; title: string; deadline: string | null }[];
  articleEvents: { id: string; article_id: string; article_title: string; title: string; event_date: string; is_completed: boolean }[];
  tasks: { id: string; session_id: string; title: string; due_date: string | null; is_done: boolean }[];
  today?: string;
}): UpcomingDeadline[] {
  const today = input.today ?? dateOnly(new Date().toISOString());
  const items: UpcomingDeadline[] = [];

  for (const session of input.sessions) {
    if (session.start_date < today) continue;
    items.push({
      id: `session-${session.id}`,
      source: "school",
      title: session.session_number ? `Zjazd ${session.session_number}` : session.title,
      date: session.start_date,
      kindLabel: "Zjazd",
      actionHref: `/lab/szkola/zjazdy/${session.id}`,
      entityKey: `session:${session.id}`,
    });
  }

  for (const segment of input.segments) {
    if (segment.status === "anulowane" || !segment.departure_date || dateOnly(segment.departure_date) < today) continue;
    items.push({
      id: `segment-${segment.id}`,
      source: "school",
      title: `${segment.departure_place || "?"} → ${segment.arrival_place || "?"}`,
      date: segment.departure_time ? `${segment.departure_date}T${segment.departure_time}` : segment.departure_date,
      kindLabel: "Transport",
      actionHref: "/lab/szkola/podroze",
      entityKey: `travel-segment:${segment.id}`,
    });
  }

  for (const accommodation of input.accommodations) {
    if (accommodation.payment_status === "anulowane" || !accommodation.check_in || dateOnly(accommodation.check_in) < today) continue;
    items.push({
      id: `accommodation-${accommodation.id}`,
      source: "school",
      title: accommodation.name,
      date: accommodation.check_in,
      kindLabel: "Nocleg",
      actionHref: "/lab/szkola/zakwaterowanie",
      entityKey: `accommodation:${accommodation.id}`,
    });
  }

  for (const semester of input.semesters) {
    if (semester.payment_status === "oplacone" || semester.payment_status === "anulowane") continue;
    if (!semester.payment_due_date || semester.payment_due_date < today) continue;
    items.push({
      id: `semester-${semester.id}`,
      source: "school",
      title: `Płatność: ${semester.name}`,
      date: semester.payment_due_date,
      kindLabel: "Płatność",
      actionHref: "/lab/szkola/semestry",
      entityKey: `semester:${semester.id}`,
    });
  }

  for (const article of input.articles) {
    if (!article.deadline || article.deadline < today) continue;
    items.push({
      id: `article-deadline-${article.id}`,
      source: "article",
      title: article.title,
      date: article.deadline,
      kindLabel: "Termin wysłania",
      actionHref: `/lab/artykuly/${article.id}`,
      entityKey: `article:${article.id}`,
    });
  }

  for (const event of input.articleEvents) {
    if (event.is_completed || event.event_date < today) continue;
    items.push({
      id: `article-event-${event.id}`,
      source: "article",
      title: `${event.title} · ${event.article_title}`,
      date: event.event_date,
      kindLabel: "Poprawki",
      actionHref: `/lab/artykuly/${event.article_id}`,
      entityKey: `article:${event.article_id}`,
    });
  }

  for (const task of input.tasks) {
    if (task.is_done || !task.due_date || task.due_date < today) continue;
    items.push({
      id: `task-${task.id}`,
      source: "school",
      title: task.title,
      date: task.due_date,
      kindLabel: "Zadanie",
      actionHref: `/lab/szkola/zjazdy/${task.session_id}`,
      entityKey: `task:${task.id}`,
    });
  }

  // Sortowanie chronologiczne; przy tym samym dniu kolejność godzinowa jest
  // zachowana naturalnie tam, gdzie mamy godzinę w dacie (odcinki podróży) —
  // porównanie leksykograficzne ISO działa poprawnie dla YYYY-MM-DD i
  // YYYY-MM-DDTHH:mm razem, bo prefiks daty jest identyczny.
  items.sort((a, b) => a.date.localeCompare(b.date));

  return items.slice(0, MAX_DEADLINES);
}
