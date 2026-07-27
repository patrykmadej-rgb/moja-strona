import { siteConfig } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 py-8 text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-400">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
        <p>{siteConfig.email}</p>
      </div>
    </footer>
  );
}
