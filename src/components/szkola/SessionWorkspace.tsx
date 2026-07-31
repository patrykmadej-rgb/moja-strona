"use client";

import { useState } from "react";
import SessionHeader from "@/components/szkola/SessionHeader";
import SessionTabs, { type SessionTabKey } from "@/components/szkola/SessionTabs";
import SessionOverview from "@/components/szkola/SessionOverview";
import SessionForm from "@/components/szkola/SessionForm";
import EmptyState from "@/components/lab/EmptyState";
import { Hourglass } from "lucide-react";
import { updateSession } from "@/app/lab/szkola/zjazdy/[id]/actions";
import type { SchoolSession, SessionTask } from "@/lib/szkola/types";

export default function SessionWorkspace({
  session,
  tasks,
}: {
  session: SchoolSession;
  tasks: SessionTask[];
}) {
  const [tab, setTab] = useState<SessionTabKey>("przeglad");
  const [editing, setEditing] = useState(false);

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        {editing ? (
          <div>
            <h1 className="font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#5b2a86]">
              Edytuj zjazd
            </h1>
            <div className="mt-4 rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
              <SessionForm
                session={session}
                action={async (formData) => {
                  await updateSession(formData);
                  setEditing(false);
                }}
                submitLabel="Zapisz zmiany"
                pendingLabel="Zapisywanie…"
                onCancel={() => setEditing(false)}
              />
            </div>
          </div>
        ) : (
          <>
            <SessionHeader session={session} onEdit={() => setEditing(true)} onNavigateTab={setTab} />

            <div className="mt-2">
              <SessionTabs tab={tab} onChange={setTab} />
            </div>

            <div className="mt-6">
              {tab === "przeglad" && <SessionOverview session={session} tasks={tasks} />}
              {tab !== "przeglad" && (
                <div className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
                  <EmptyState
                    icon={Hourglass}
                    title="Ta zakładka jest w przygotowaniu"
                    subtitle="Wróci tutaj w kolejnym etapie rozbudowy modułu Szkoły psychoterapii."
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
