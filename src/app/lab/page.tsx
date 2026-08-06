import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/dashboard/data";
import { buildWeeklyPriorities } from "@/lib/dashboard/priorities";
import { filterBySource, parseDashboardFilter } from "@/lib/dashboard/filter";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardFilterToggle from "@/components/dashboard/DashboardFilterToggle";
import AttentionSection from "@/components/dashboard/AttentionSection";
import DashboardNextSessionCard from "@/components/dashboard/DashboardNextSessionCard";
import DashboardArticlesCard from "@/components/dashboard/DashboardArticlesCard";
import DashboardDeadlinesCard from "@/components/dashboard/DashboardDeadlinesCard";
import DashboardQuickActionsCard from "@/components/dashboard/DashboardQuickActionsCard";
import DashboardActivityCard from "@/components/dashboard/DashboardActivityCard";
import DashboardWeeklyPrioritiesCard from "@/components/dashboard/DashboardWeeklyPrioritiesCard";

export const metadata: Metadata = { title: "Pulpit" };

export default async function LabDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ zakres?: string }>;
}) {
  const { zakres } = await searchParams;
  const filter = parseDashboardFilter(zakres);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = user
    ? await getDashboardData(user.id)
    : {
        attentionItems: { data: [], error: null },
        nextSession: { data: null, error: null },
        activeArticles: { data: [], error: null },
        upcomingDeadlines: { data: [], error: null },
        recentActivity: { data: [], error: null },
        weeklyPriorities: { data: [], error: null },
      };

  const attentionItems = filterBySource(data.attentionItems.data, filter);
  const upcomingDeadlines = filterBySource(data.upcomingDeadlines.data, filter);
  const recentActivity = filterBySource(data.recentActivity.data, filter);
  // activeArticles nie ma pola `source` (zawsze "article") — filtrowanie "szkola" == puste.
  const activeArticlesForPriorities = filter === "szkola" ? [] : data.activeArticles.data;
  const weeklyPriorities =
    filter === "wszystko"
      ? data.weeklyPriorities.data
      : buildWeeklyPriorities({ attentionItems, upcomingDeadlines, activeArticles: activeArticlesForPriorities });

  return (
    <div className="lab-pulpit-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1320px] px-8 pt-9 pb-16">
        <DashboardHeader />

        <div className="mt-6">
          <DashboardFilterToggle current={filter} />
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <AttentionSection items={attentionItems} error={data.attentionItems.error} />

          <div className="grid grid-cols-1 items-stretch gap-5 min-[900px]:grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)]">
            <DashboardNextSessionCard data={data.nextSession.data} error={data.nextSession.error} />
            <DashboardArticlesCard articles={filter === "szkola" ? [] : data.activeArticles.data} error={data.activeArticles.error} />
          </div>

          {/*
            Sekcja 14 briefu: na mobile kolejność ma być Terminy, POTEM
            Priorytety, POTEM Szybkie akcje/Ostatnia aktywność — inna niż na
            desktopie (gdzie Priorytety to osobny, ostatni pełnoszerokościowy
            rząd). CSS order działa tylko między rodzeństwem w TYM SAMYM
            kontenerze flex/grid, więc wszystkie cztery karty (Terminy/Akcje/
            Aktywność/Priorytety) muszą być bezpośrednimi dziećmi jednego
            grida — na desktopie Priorytety dostaje pełny col-span i domyślny
            (czyli: ostatni w DOM) porządek, więc i tak ląduje w nowym rzędzie
            pod resztą.
          */}
          <div className="grid grid-cols-1 items-stretch gap-5 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3">
            <div className="order-1 min-[700px]:order-none">
              <DashboardDeadlinesCard deadlines={upcomingDeadlines} error={data.upcomingDeadlines.error} />
            </div>
            <div className="order-3 min-[700px]:order-none">
              <DashboardQuickActionsCard />
            </div>
            <div className="order-4 min-[700px]:order-none">
              <DashboardActivityCard items={recentActivity} error={data.recentActivity.error} />
            </div>
            <div className="order-2 min-[700px]:order-none min-[700px]:col-span-2 min-[1100px]:col-span-3">
              <DashboardWeeklyPrioritiesCard priorities={weeklyPriorities} error={data.weeklyPriorities.error} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
