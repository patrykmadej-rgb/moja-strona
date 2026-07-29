import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publications } from "@/lib/publications";
import { tagToSlug, slugToTag, getAllTags } from "@/lib/tags";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
  const allTags = getAllTags(publications);
  return allTags.map((tag) => ({ tag: tagToSlug(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag: slug } = await params;
  const allTags = getAllTags(publications);
  const tag = slugToTag(slug, allTags);
  if (!tag) return {};
  return {
    title: `${tag} — ${siteConfig.name}`,
    description: `Publikacje i materiały oznaczone tagiem „${tag}".`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: slug } = await params;
  const allTags = getAllTags(publications);
  const tag = slugToTag(slug, allTags);
  if (!tag) notFound();

  const tagged = publications.filter((p) => p.tags.includes(tag));

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <Link
        href="/publikacje"
        className="inline-flex items-center gap-2 text-sm text-[#4A1D6E] hover:underline dark:text-purple-400 mb-10"
      >
        ← Wszystkie publikacje
      </Link>

      <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
        Tag
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        {tag}
      </h1>
      <p className="mt-3 text-[#4A3360] dark:text-neutral-400">
        {tagged.length} {tagged.length === 1 ? "publikacja" : tagged.length < 5 ? "publikacje" : "publikacji"}
      </p>

      <div className="mt-12">
        <p className="mb-4 text-xs font-semibold tracking-[0.2em] uppercase text-[#4A1D6E] dark:text-purple-400">
          Publikacje
        </p>
        <ul className="flex flex-col gap-4">
          {tagged.map((pub) => (
            <li key={pub.slug}>
              <Link
                href={`/publikacje/${pub.slug}`}
                className="group flex items-start justify-between gap-4 rounded-2xl border border-[#4A1D6E]/15 bg-white p-6 transition-all hover:border-[#4A1D6E]/40 hover:shadow-md dark:bg-neutral-900 dark:border-white/10 dark:hover:border-purple-400/30"
              >
                <div className="flex-1">
                  <span className="inline-block rounded-full bg-[#EDE6F8] px-3 py-0.5 text-xs font-medium text-[#4A1D6E] dark:bg-purple-900/30 dark:text-purple-300">
                    {pub.type}
                  </span>
                  <h2 className="mt-2 font-semibold text-[#1C1028] group-hover:text-[#4A1D6E] transition-colors dark:text-white dark:group-hover:text-purple-300">
                    {pub.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#4A3360] dark:text-neutral-400">
                    {pub.venue} · {pub.year}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-[#4A1D6E] opacity-0 group-hover:opacity-100 transition-opacity dark:text-purple-400">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
