"use client";

export const EXPLORE_AXES_EVENT = "research:explore-axes";

export default function ExploreAxesButton({ label }: { label: string }) {
  function handleClick() {
    const target = document.getElementById("osie-badawcze");
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      target.scrollIntoView();
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.dispatchEvent(new Event(EXPLORE_AXES_EVENT));
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-8 inline-flex items-center gap-2 bg-[#4A1D6E] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
    >
      {label} ↓
    </button>
  );
}
