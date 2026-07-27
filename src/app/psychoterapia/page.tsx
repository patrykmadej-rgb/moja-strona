import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Psychoterapia — ${siteConfig.name}`,
  description: "Informacje o podejściu psychoterapeutycznym.",
};

// TODO: uzupełnij poniższe sekcje własną treścią, gdy będziesz gotów/gotowa
// przyjmować klientów. Na razie strona ma charakter wyłącznie informacyjny.
export default function PsychoterapiaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Psychoterapia</h1>
      <p className="mt-4 text-neutral-600 dark:text-neutral-300">
        Ta sekcja ma obecnie charakter wyłącznie informacyjny — nie prowadzę jeszcze naboru
        klientów ani zapisów online.
      </p>

      <div className="mt-8 space-y-10">
        <section>
          <h2 className="text-xl font-semibold">Moje podejście</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">
            Opisz tutaj nurt / podejście terapeutyczne, w którym się szkolisz, oraz filozofię
            pracy z klientem.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Dla kogo</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">
            Opisz, z jakimi tematami / grupami klientów planujesz docelowo pracować.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Wykształcenie i szkolenie</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">
            Wymień ukończone i trwające szkolenia, superwizję oraz certyfikaty w toku.
          </p>
        </section>
      </div>

      <div className="mt-12 rounded-xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-medium">Ważna informacja</p>
        <p className="mt-2">
          Treści na tej stronie mają charakter wyłącznie informacyjny i nie stanowią porady
          psychologicznej ani psychoterapeutycznej. Jeśli jesteś w kryzysie lub Twoje życie /
          zdrowie jest zagrożone, zadzwoń pod numer alarmowy 112 lub skontaktuj się z Telefonem
          Zaufania dla Dorosłych w Kryzysie Emocjonalnym: 116 123.
        </p>
      </div>
    </div>
  );
}
