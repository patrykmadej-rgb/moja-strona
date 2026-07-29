import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicationBySlug, publications } from "@/lib/publications";
import { tagToSlug } from "@/lib/tags";
import { siteConfig } from "@/lib/site-config";
import AbstractToggle from "@/components/AbstractToggle";

export function generateStaticParams() {
  return publications.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pub = getPublicationBySlug(slug);
  if (!pub) return {};
  return {
    title: `${pub.title} — ${siteConfig.name}`,
    description: pub.abstractPl || pub.title,
  };
}

export default async function PublikacjaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pub = getPublicationBySlug(slug);
  if (!pub) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href="/publikacje"
        className="inline-flex items-center gap-2 text-sm text-[#5C2D91] hover:underline dark:text-purple-400 mb-10"
      >
        ← Wszystkie publikacje
      </Link>

      <span className="inline-block rounded-full bg-[#EDE6F8] px-3 py-0.5 text-xs font-medium text-[#5C2D91] dark:bg-purple-900/30 dark:text-purple-300">
        {pub.type}
      </span>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#1C1028] leading-snug dark:text-white">
        {pub.title}
      </h1>

      <p className="mt-3 text-[#4A3360] dark:text-neutral-400">
        {pub.venue} · {pub.year}
      </p>

      {pub.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {pub.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tagi/${tagToSlug(tag)}`}
              className="rounded-full border border-[#5C2D91]/20 px-3 py-0.5 text-xs text-[#5C2D91] hover:bg-[#EDE6F8] hover:border-[#5C2D91]/50 transition-colors dark:border-purple-400/20 dark:text-purple-300 dark:hover:bg-purple-900/20"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {pub.coverImage && (
        <div className="relative mt-8 mb-10 aspect-video w-full overflow-hidden rounded-2xl">
          <Image
            src={pub.coverImage}
            alt={pub.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      {(pub.pdfUrl || (pub.externalLinks && pub.externalLinks.length > 0)) && (
        <div className="mt-8 flex flex-wrap gap-3">
          {pub.pdfUrl && (
            <a
              href={pub.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#5C2D91] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7B4DB8] transition-colors"
            >
              ↓ Pobierz PDF
            </a>
          )}
          {pub.externalLinks?.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#5C2D91]/30 px-5 py-2.5 text-sm font-medium text-[#5C2D91] hover:border-[#5C2D91] hover:bg-[#EDE6F8] transition-colors dark:border-purple-400/30 dark:text-purple-300 dark:hover:bg-purple-900/20"
            >
              {link.label} →
            </a>
          ))}
        </div>
      )}

      <AbstractToggle abstractPl={pub.abstractPl} abstractEn={pub.abstractEn} />
    </div>
  );
}
