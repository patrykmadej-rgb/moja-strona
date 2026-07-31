import Link from "next/link";
import {
  IconLayoutDashboard,
  IconFileText,
  IconBooks,
  IconChecklist,
  IconCalendar,
  IconNotes,
  IconChartBar,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";
import { signOutLab } from "@/app/lab/actions";

const placeholderIcons = [
  { icon: IconLayoutDashboard, label: "Pulpit" },
  { icon: IconBooks, label: "Biblioteka" },
  { icon: IconChecklist, label: "Zadania" },
  { icon: IconCalendar, label: "Kalendarz" },
  { icon: IconNotes, label: "Notatki" },
  { icon: IconChartBar, label: "Statystyki" },
  { icon: IconSettings, label: "Ustawienia" },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-16 shrink-0 flex-col items-center gap-2 bg-[#1C1028] py-6">
      <Link
        href="/lab/artykuly"
        title="Artykuły"
        className="flex h-11 w-11 items-center justify-center bg-[#4A1D6E] text-white transition-colors hover:bg-[#5B2586]"
      >
        <IconFileText className="h-5 w-5" stroke={1.75} />
      </Link>

      <div className="mt-1 flex flex-col items-center gap-1">
        {placeholderIcons.map(({ icon: Icon, label }) => (
          <span
            key={label}
            title={`${label} — wkrótce`}
            aria-disabled="true"
            className="flex h-11 w-11 cursor-not-allowed items-center justify-center text-white/25"
          >
            <Icon className="h-5 w-5" stroke={1.75} />
          </span>
        ))}
      </div>

      <form action={signOutLab} className="mt-auto">
        <button
          type="submit"
          title="Wyloguj"
          className="flex h-11 w-11 items-center justify-center text-white/50 transition-colors hover:text-white"
        >
          <IconLogout className="h-5 w-5" stroke={1.75} />
        </button>
      </form>
    </aside>
  );
}
