import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PsychoterapiaPage");
  return {
    title: `${t("metaTitle")} — ${siteConfig.name}`,
    description: t("metaDescription"),
  };
}

export default async function PsychoterapiaPage() {
  const t = await getTranslations("PsychoterapiaPage");
  const list = t.raw("sections.podejscie.list") as string[];

  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  const strongDark = (chunks: React.ReactNode) => (
    <strong className="text-[#1C1028] dark:text-white">{chunks}</strong>
  );

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        {/* Desktop / tablet: pełne tło na całą szerokość ekranu, tekst nałożony */}
        <div className="relative left-[calc(-50vw+50%)] hidden w-screen lg:block lg:min-h-[560px]">
          <Image
            src="/psychoterapia-hero.png"
            alt="Ilustracja przedstawiająca terapeutę i klientkę siedzących naprzeciw siebie, połączonych fioletową siecią neuronową"
            fill
            priority
            className="z-0 object-cover object-center"
          />
          {/* Bardzo lekka, wąska podkładka — tylko delikatny "odblask" tuż za tekstem,
              żeby postać po lewej NIE wyglądała na wypłowiałą. Czytelność tekstu zapewnia
              głównie warstwowy text-shadow (miękka jasna poświata) poniżej, nie tło. */}
          <div className="absolute inset-0 z-[5] bg-gradient-to-r from-[#F5F1EC]/35 from-0% via-[#F5F1EC]/12 via-18% to-transparent to-32% dark:from-neutral-950/35 dark:via-neutral-950/12" />
          <div className="relative z-10 flex lg:min-h-[560px] items-center">
            <div className="max-w-xl pt-28 pb-12 pl-16">
              <p
                className="mb-4 text-xs font-semibold tracking-[0.15em] uppercase text-[#4A1D6E] dark:text-purple-400"
                style={{ textShadow: "0 0 6px rgba(245,241,236,0.95), 0 0 16px rgba(245,241,236,0.85), 0 1px 3px rgba(245,241,236,0.7)" }}
              >
                {t("eyebrow")}
              </p>
              <h1
                className="text-4xl font-semibold tracking-tight text-[#1C1028] lg:text-5xl dark:text-white"
                style={{ textShadow: "0 0 10px rgba(245,241,236,0.95), 0 0 26px rgba(245,241,236,0.85), 0 2px 6px rgba(245,241,236,0.7)" }}
              >
                {t("h1")}
              </h1>
              <p
                className="mt-5 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300"
                style={{ textShadow: "0 0 8px rgba(245,241,236,0.95), 0 0 22px rgba(245,241,236,0.85), 0 1px 4px rgba(245,241,236,0.7)" }}
              >
                {t("intro")}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile: prosty układ pionowy, bez nakładki */}
        <div className="px-6 py-16 lg:hidden">
          <p className="mb-4 text-xs font-semibold tracking-[0.15em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
            {t("h1")}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
            {t("intro")}
          </p>
          <div className="mt-10">
            <Image
              src="/psychoterapia-hero.png"
              alt="Ilustracja przedstawiająca terapeutę i klientkę siedzących naprzeciw siebie, połączonych fioletową siecią neuronową"
              width={1672}
              height={941}
              className="h-auto w-full rounded-2xl"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-20">
        {/* Ważna informacja - na górze */}
        <div className="rounded-2xl border border-[#4A1D6E]/15 bg-gradient-to-br from-[#EDE6F8] to-[#F5EAD3] p-5 text-sm text-[#4A3360] dark:border-purple-400/20 dark:from-purple-900/20 dark:to-amber-900/10 dark:text-neutral-300">
          <p className="font-semibold text-[#4A1D6E] dark:text-purple-300">{t("warningTitle")}</p>
          <p className="mt-2 leading-relaxed">
            {t.rich("warningText", { strong })}
          </p>
        </div>

        <div className="mt-14 space-y-14">

          {/* Szkolenie */}
          <section>
            <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
              {t("sections.szkolenie.eyebrow")}
            </p>
            <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
              {t("sections.szkolenie.heading")}
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
              <p>{t.rich("sections.szkolenie.p1", { strong: strongDark })}</p>
              <p>{t("sections.szkolenie.p2")}</p>
            </div>
          </section>

          {/* Podejście */}
          <section>
            <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
              {t("sections.podejscie.eyebrow")}
            </p>
            <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
              {t("sections.podejscie.heading")}
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
              <p>{t("sections.podejscie.p1")}</p>
              <ul className="ml-4 space-y-2 list-disc marker:text-[#4A1D6E]">
                {list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>{t.rich("sections.podejscie.emdrLine", { strong: strongDark })}</li>
              </ul>
              <p>{t("sections.podejscie.p2")}</p>
            </div>
          </section>

          {/* Dla kogo */}
          <section>
            <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
              {t("sections.dlaKogo.eyebrow")}
            </p>
            <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
              {t("sections.dlaKogo.heading")}
            </h2>
            <div className="mt-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
              <p>{t("sections.dlaKogo.p1")}</p>
            </div>
          </section>

          {/* Wykształcenie */}
          <section>
            <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
              {t("sections.wyksztalcenie.eyebrow")}
            </p>
            <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
              {t("sections.wyksztalcenie.heading")}
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
              <p>{t("sections.wyksztalcenie.p1")}</p>
              <p>{t("sections.wyksztalcenie.p2")}</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
