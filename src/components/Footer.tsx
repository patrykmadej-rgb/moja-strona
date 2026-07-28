import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#5C2D91]/10 py-10 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-[#1C1028] dark:text-white">{siteConfig.name}</p>
            <p className="mt-1 text-xs text-[#5C2D91] dark:text-purple-400 tracking-wide">
              {siteConfig.title}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-[#4A3360] dark:text-neutral-400">
            <Link href="/#o-mnie" className="hover:text-[#5C2D91] dark:hover:text-purple-300">O mnie</Link>
            <Link href="/badania" className="hover:text-[#5C2D91] dark:hover:text-purple-300">Badania</Link>
            <Link href="/publikacje" className="hover:text-[#5C2D91] dark:hover:text-purple-300">Publikacje</Link>
            <Link href="/psychoterapia" className="hover:text-[#5C2D91] dark:hover:text-purple-300">Psychoterapia</Link>
            <Link href="/kontakt" className="hover:text-[#5C2D91] dark:hover:text-purple-300">Kontakt</Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-[#5C2D91]/10 pt-6 text-xs text-[#4A3360] dark:border-white/10 dark:text-neutral-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}</p>
          <a href={`mailto:${siteConfig.email}`} className="hover:text-[#5C2D91] dark:hover:text-purple-400">
            {siteConfig.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
