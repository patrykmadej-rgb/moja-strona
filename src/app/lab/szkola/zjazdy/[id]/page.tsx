import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SessionWorkspace from "@/components/szkola/SessionWorkspace";
import type { SchoolSession, SessionTask } from "@/lib/szkola/types";

export const metadata: Metadata = {
  title: "Zjazd",
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("school_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  const { data: tasksData } = await supabase
    .from("session_tasks")
    .select("*")
    .eq("session_id", id)
    .order("sort_order", { ascending: true });

  return (
    <SessionWorkspace
      session={session as SchoolSession}
      tasks={(tasksData as SessionTask[] | null) ?? []}
    />
  );
}
