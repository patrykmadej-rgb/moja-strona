import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAlerts } from "@/lib/szkola/alertsEngine";

/**
 * Codzienne sprawdzenie (sekcja 16) — JEDEN skonsolidowany endpoint
 * wykonujący kolejno wszystkie zadania dzienne (na razie: regeneracja
 * alertów, która sama w sobie obejmuje sprawdzenie zbliżających się
 * terminów, końca darmowego anulowania, brakujących biletów, nieopłaconych
 * zjazdów i zalegających importów — patrz alertsEngine.ts). Cotygodniowa
 * synchronizacja kalendarza ma OSOBNY, już istniejący endpoint
 * (/api/cron/calendar-sync) — celowo nie duplikujemy go tutaj.
 *
 * Zabezpieczone tym samym mechanizmem CRON_SECRET co calendar-sync.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET nie jest skonfigurowany — zadanie zablokowane." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: usersList, error: usersError } = await admin.auth.admin.listUsers();
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const results: { userId: string; status: "success" | "failed"; alertsCreated?: number; message?: string }[] = [];

  for (const user of usersList.users) {
    const { data: run, error: runError } = await admin
      .from("school_automation_runs")
      .insert({ user_id: user.id, task_type: "daily_checks", status: "running" })
      .select()
      .single();
    if (runError) {
      results.push({ userId: user.id, status: "failed", message: runError.message });
      continue;
    }

    try {
      const result = await generateAlerts(admin, user.id);
      await admin
        .from("school_automation_runs")
        .update({
          completed_at: new Date().toISOString(),
          status: "success",
          records_processed: result.recordsProcessed,
          alerts_created: result.alertsCreated,
        })
        .eq("id", run.id);
      results.push({ userId: user.id, status: "success", alertsCreated: result.alertsCreated });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nieznany błąd.";
      await admin
        .from("school_automation_runs")
        .update({ completed_at: new Date().toISOString(), status: "failed", error_message: message })
        .eq("id", run.id);
      results.push({ userId: user.id, status: "failed", message });
    }
  }

  return NextResponse.json({ checked: usersList.users.length, results });
}
