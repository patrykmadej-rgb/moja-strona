import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel",
};

const cards = [
  {
    href: "/panel/pomysly",
    title: "Pomysły na artykuły",
    description: "Baza pomysłów na publikacje: tytuł, opis, tagi i załączone materiały PDF.",
  },
  {
    href: "/panel/zjazdy",
    title: "Zjazdy",
    description:
      "Zarządzanie wyjazdami: terminy, bilety, zakwaterowanie, koszty i status opłat.",
  },
];

export default function PanelPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Prywatny obszar roboczy — widoczny tylko po zalogowaniu.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-black/10 p-5 transition-colors hover:border-neutral-400 dark:border-white/10 dark:hover:border-neutral-500"
          >
            <h2 className="font-medium">{card.title}</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
