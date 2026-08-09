"use client";

export default function ExploreAxesButton({ label }: { label: string }) {
  function handleClick() {
    const target = document.getElementById("research-directions");
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <button type="button" onClick={handleClick} className="research-btn research-btn--primary">
      {label}
      <span aria-hidden="true" className="research-btn-arrow">
        →
      </span>
    </button>
  );
}
