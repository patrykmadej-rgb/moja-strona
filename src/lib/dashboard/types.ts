import type { ArticlePriority, ArticleStatus } from "@/lib/lab/types";
import type { PrepItem } from "@/lib/szkola/preparation";
import type { Accommodation, SchoolSession, TravelSegment } from "@/lib/szkola/types";

export type DashboardFilterKey = "wszystko" | "szkola" | "artykuly";
export type DashboardSource = "school" | "article";

/**
 * Cztery poziomy z sekcji 6 briefu: 1. krytyczne/przeterminowane,
 * 2. pilne w ciągu 7 dni, 3. wymagające weryfikacji, 4. ostrzeżenia informacyjne.
 */
export type AttentionSeverity = "critical" | "urgent" | "review" | "info";

export const ATTENTION_SEVERITY_ORDER: Record<AttentionSeverity, number> = {
  critical: 0,
  urgent: 1,
  review: 2,
  info: 3,
};

export const ATTENTION_SEVERITY_LABELS: Record<AttentionSeverity, string> = {
  critical: "Krytyczne",
  urgent: "Pilne",
  review: "Do weryfikacji",
  info: "Informacja",
};

export type DashboardAttentionItem = {
  id: string;
  source: DashboardSource;
  title: string;
  context: string;
  severity: AttentionSeverity;
  actionLabel: string;
  actionHref: string;
  dueDate?: string | null;
  createdAt: string;
  /**
   * Identyfikator PRAWDZIWEGO bytu za wierszem (np. "article:{id}",
   * "session:{id}") — OSOBNY od `id` wiersza (który jest złożony, np.
   * "article-deadline-{id}"). Używany do deduplikacji między sekcjami
   * (buildWeeklyPriorities) — dwa różne wiersze ("Termin się zbliża" w
   * uwadze i "Termin wysłania" w nadchodzących terminach) mogą dotyczyć
   * TEGO SAMEGO artykułu i muszą się rozpoznać jako duplikat.
   */
  entityKey: string;
};

export type NextSessionData = {
  session: SchoolSession;
  daysUntil: number;
  transportStatus: PrepItem;
  accommodationStatus: PrepItem;
  paymentStatus: PrepItem;
  costCount: number;
  schedulePreview: { label: string; time: string }[];
  /** Najbliższy chronologicznie odcinek podróży/nocleg tego zjazdu (może być null — patrz DashboardNextSessionCard, pusty stan z linkiem dodania). Mobilny ekran startowy (sekcja 3 briefu) pokazuje te same dane co desktop, bez osobnego zapytania. */
  nextSegment: TravelSegment | null;
  nextAccommodation: Accommodation | null;
};

export type DashboardArticleRow = {
  id: string;
  title: string;
  status: ArticleStatus;
  priority: ArticlePriority;
  updatedAt: string;
};

export type UpcomingDeadline = {
  id: string;
  source: DashboardSource;
  title: string;
  /** ISO datetime lub YYYY-MM-DD — patrz formatDeadlineShort w komponencie karty. */
  date: string;
  kindLabel: string;
  actionHref: string;
  /** Patrz komentarz przy DashboardAttentionItem.entityKey — ten sam mechanizm deduplikacji. */
  entityKey: string;
};

export type ActivityItem = {
  id: string;
  source: DashboardSource;
  description: string;
  at: string;
};

export type WeeklyPriority = {
  rank: 1 | 2 | 3;
  title: string;
  severity: AttentionSeverity;
  actionLabel: string;
  actionHref: string;
};

/** Wynik jednej sekcji pulpitu — pozwala awarii jednej sekcji (sekcja 16 briefu) nie wywalić pozostałych. */
export type SectionResult<T> = { data: T; error: string | null };

export type DashboardData = {
  attentionItems: SectionResult<DashboardAttentionItem[]>;
  nextSession: SectionResult<NextSessionData | null>;
  activeArticles: SectionResult<DashboardArticleRow[]>;
  upcomingDeadlines: SectionResult<UpcomingDeadline[]>;
  recentActivity: SectionResult<ActivityItem[]>;
  weeklyPriorities: SectionResult<WeeklyPriority[]>;
};
