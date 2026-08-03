"use client";

export const EXPLORE_AXES_EVENT = "research:explore-axes";

export default function ExploreAxesButton({ label }: { label: string }) {
  function handleClick() {
    // Na mobile sekcja kart osi (#osie-badawcze) jest ukryta (żeby nie dublować
    // treści accordionu mapy), więc celujemy wtedy w accordion mapy zamiast niej.
    const cardsSection = document.getElementById("osie-badawcze");
    const target = cardsSection && cardsSection.offsetParent !== null
      ? cardsSection
      : document.getElementById("osie-badawcze-mobile");
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      target.scrollIntoView();
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (target === cardsSection) {
        window.dispatchEvent(new Event(EXPLORE_AXES_EVENT));
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group rounded-research-sm inline-flex h-12 items-center justify-center gap-2 bg-[#4A1D6E] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
    >
      {label}
      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
        →
      </span>
    </button>
  );
}
