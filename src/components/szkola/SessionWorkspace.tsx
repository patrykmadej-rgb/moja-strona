"use client";

import { useState } from "react";
import SessionHeader from "@/components/szkola/SessionHeader";
import SessionTabs, { type SessionTabKey } from "@/components/szkola/SessionTabs";
import SessionOverview from "@/components/szkola/SessionOverview";
import SessionForm from "@/components/szkola/SessionForm";
import TravelTab from "@/components/szkola/TravelTab";
import AccommodationTab from "@/components/szkola/AccommodationTab";
import SchoolPaymentsTab from "@/components/szkola/SchoolPaymentsTab";
import ExpensesTab from "@/components/szkola/ExpensesTab";
import SessionScheduleTab from "@/components/szkola/SessionScheduleTab";
import MaterialsTab from "@/components/szkola/MaterialsTab";
import DocumentsTab from "@/components/szkola/DocumentsTab";
import TrainingHoursTab from "@/components/szkola/TrainingHoursTab";
import EmptyState from "@/components/lab/EmptyState";
import { Hourglass } from "lucide-react";
import { updateSession } from "@/app/lab/szkola/zjazdy/[id]/actions";
import type {
  Accommodation,
  Expense,
  SchoolCalendarEvent,
  SchoolPayment,
  SchoolSession,
  SessionDocument,
  SessionMaterial,
  SessionScheduleItem,
  SessionTask,
  TrainingHoursEntry,
  TravelSegment,
} from "@/lib/szkola/types";

export default function SessionWorkspace({
  session,
  tasks,
  segments,
  accommodations,
  payments,
  expenses,
  scheduleItems,
  materials,
  documents,
  hoursEntries,
  importableGoogleEvents,
}: {
  session: SchoolSession;
  tasks: SessionTask[];
  segments: TravelSegment[];
  accommodations: Accommodation[];
  payments: SchoolPayment[];
  expenses: Expense[];
  scheduleItems: SessionScheduleItem[];
  materials: SessionMaterial[];
  documents: SessionDocument[];
  hoursEntries: TrainingHoursEntry[];
  importableGoogleEvents: SchoolCalendarEvent[];
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
              {tab === "przeglad" && (
                <SessionOverview
                  session={session}
                  tasks={tasks}
                  segments={segments}
                  accommodations={accommodations}
                  payments={payments}
                  expenses={expenses}
                  scheduleItems={scheduleItems}
                  materials={materials}
                  documents={documents}
                  hoursEntries={hoursEntries}
                  onNavigateTab={setTab}
                />
              )}
              {tab === "podroz" && <TravelTab sessionId={session.id} segments={segments} />}
              {tab === "zakwaterowanie" && (
                <AccommodationTab sessionId={session.id} accommodations={accommodations} />
              )}
              {tab === "platnosci" && <SchoolPaymentsTab sessionId={session.id} payments={payments} />}
              {tab === "koszty" && <ExpensesTab sessionId={session.id} expenses={expenses} />}
              {tab === "plan" && (
                <SessionScheduleTab sessionId={session.id} items={scheduleItems} importableGoogleEvents={importableGoogleEvents} />
              )}
              {tab === "materialy" && <MaterialsTab sessionId={session.id} materials={materials} />}
              {tab === "dokumenty" && <DocumentsTab sessionId={session.id} documents={documents} />}
              {tab === "godziny" && (
                <TrainingHoursTab sessionId={session.id} entries={hoursEntries} scheduleItems={scheduleItems} />
              )}
              {tab !== "przeglad" &&
                tab !== "podroz" &&
                tab !== "zakwaterowanie" &&
                tab !== "platnosci" &&
                tab !== "koszty" &&
                tab !== "plan" &&
                tab !== "materialy" &&
                tab !== "dokumenty" &&
                tab !== "godziny" && (
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
