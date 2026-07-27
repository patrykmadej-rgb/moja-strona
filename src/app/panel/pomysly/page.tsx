import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { ArticleIdea } from "@/lib/types";
import IdeaForm from "@/components/panel/IdeaForm";
import DeleteButton from "@/components/panel/DeleteButton";
import { deleteIdea } from "./actions";

export const metadata: Metadata = {
  title: "Pomysły na artykuły",
};

export default async function PomyslyPage() {
  const supabase = await createClient();
  const { data: ideas } = await supabase
    .from("article_ideas")
    .select("*")
    .order("created_at", { ascending: false });

  const ideasWithUrls = await Promise.all(
    ((ideas as ArticleIdea[] | null) ?? []).map(async (idea) => {
      let pdfUrl: string | null = null;
      if (idea.pdf_path) {
        const { data } = await supabase.storage
          .from("documents")
          .createSignedUrl(idea.pdf_path, 60 * 10);
        pdfUrl = data?.signedUrl ?? null;
      }
      return { ...idea, pdfUrl };
    }),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Pomysły na artykuły</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Baza pomysłów na publikacje naukowe.
      </p>

      <IdeaForm />

      <ul className="mt-8 flex flex-col gap-4">
        {ideasWithUrls.map((idea) => (
          <li
            key={idea.id}
            className="rounded-xl border border-black/10 p-5 dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-medium">{idea.title}</h2>
                {idea.description && (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {idea.description}
                  </p>
                )}
                {idea.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {idea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {idea.pdfUrl && (
                  <a
                    href={idea.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Otwórz PDF
                  </a>
                )}
              </div>
              <DeleteButton id={idea.id} filePath={idea.pdf_path} action={deleteIdea} />
            </div>
          </li>
        ))}
        {ideasWithUrls.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Brak pomysłów — dodaj pierwszy powyżej.
          </p>
        )}
      </ul>
    </div>
  );
}
