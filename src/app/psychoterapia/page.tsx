import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Psychoterapia — ${siteConfig.name}`,
  description:
    "Informacje o moim szkoleniu psychoterapeutycznym, podejściu i planowanej praktyce.",
};

export default function PsychoterapiaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      {/* Nagłówek */}
      <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
        Psychoterapia
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        Człowiek w centrum.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
        Psychoterapia to dla mnie przestrzeń, w której teoria spotyka się z człowiekiem —
        jego historią, relacjami i możliwością zmiany.
      </p>

      {/* Ważna informacja - na górze */}
      <div className="mt-8 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-semibold">Ważna informacja</p>
        <p className="mt-2 leading-relaxed">
          Jestem w trakcie szkolenia psychoterapeutycznego — nie prowadzę jeszcze gabinetu
          ani nie przyjmuję klientów. Ta strona ma charakter wyłącznie informacyjny.
          Jeśli jesteś w kryzysie lub Twoje życie bądź zdrowie jest zagrożone, zadzwoń pod
          numer alarmowy <strong>112</strong> lub skontaktuj się z Telefonem Zaufania
          dla Dorosłych w Kryzysie Emocjonalnym: <strong>116 123</strong>.
        </p>
      </div>

      <div className="mt-14 space-y-14">

        {/* Szkolenie */}
        <section>
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            Szkolenie
          </p>
          <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
            Cztery lata, jeden cel
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
            <p>
              Od września 2026 roku jestem uczestnikiem czteroletniego kursu psychoterapii
              akredytowanego przez Sekcję Naukową Psychoterapii i Terapii Rodzin
              <strong className="text-[#1C1028] dark:text-white"> Polskiego Towarzystwa Psychiatrycznego</strong>.
            </p>
            <p>
              Szkolenie obejmuje ponad 1080 godzin dydaktycznych — wykłady, ćwiczenia,
              superwizje oraz własne doświadczenie terapeutyczne. Zjazdy odbywają się
              w trybie weekendowym.
            </p>
          </div>
        </section>

        {/* Podejście */}
        <section>
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            Podejście
          </p>
          <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
            Nurt integracyjno-psychodynamiczny
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
            <p>
              Pracuję w nurcie integracyjno-psychodynamicznym, który łączy klasyczne
              fundamenty teorii psychoanalitycznej z nowoczesnymi podejściami klinicznymi.
              Program obejmuje m.in.:
            </p>
            <ul className="ml-4 space-y-2 list-disc marker:text-[#4A1D6E]">
              <li>Teorię relacji z obiektem i teorię przywiązania</li>
              <li>Psychologię self i teorię ego</li>
              <li>Terapię opartą na mentalizacji (MBT)</li>
              <li>Terapię opartą na przeniesieniu (TFP)</li>
              <li>
                Metodę <strong className="text-[#1C1028] dark:text-white">EMDR</strong>{" "}
                (Eye Movement Desensitization and Reprocessing) w pracy z traumą —
                rekomendowaną przez WHO
              </li>
            </ul>
            <p>
              Moje zainteresowania kliniczne obejmują szczególnie traumę, wiktymizację,
              zaburzenia lękowe i neuroróżnorodność.
            </p>
          </div>
        </section>

        {/* Dla kogo */}
        <section>
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            Dla kogo
          </p>
          <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
            Docelowo: osoby dorosłe
          </h2>
          <div className="mt-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
            <p>
              Planuję pracę z osobami dorosłymi, szczególnie w zakresie traumy
              (w tym traumy wtórnej i wiktymizacji), zaburzeń lękowych, trudności
              w relacjach oraz poszukiwania sensu i tożsamości. Moje doświadczenie
              badawcze z obszaru kryminologii i wiktymologii stanowi dodatkowe tło
              do rozumienia specyficznych doświadczeń klientów.
            </p>
          </div>
        </section>

        {/* Wykształcenie */}
        <section>
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            Wykształcenie i doświadczenie
          </p>
          <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
            Interdyscyplinarny kontekst
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
            <p>
              Łączę wykształcenie prawnicze i politologiczne (doktorat na Uniwersytecie
              Szczecińskim) z aktualnym kształceniem w psychologii (studia jednolite).
              Taka kombinacja pozwala mi patrzeć na człowieka w szerokim kontekście —
              systemowym, prawnym i interpersonalnym.
            </p>
            <p>
              Szkolenie psychoterapeutyczne uzupełnia tę perspektywę o kompetencje
              kliniczne i warsztat pracy z drugą osobą.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
