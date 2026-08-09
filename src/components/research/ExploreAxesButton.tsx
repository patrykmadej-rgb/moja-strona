"use client";

export default function ExploreAxesButton({ label }: { label: string }) {
  function handleClick() {
    const target = document.getElementById("obszary-badawcze");
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-research-sm group inline-flex h-12 items-center justify-center gap-2 bg-[#4A1D6E] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073]"
    >
      {label}
      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
        →
      </span>
    </button>
  );
}
