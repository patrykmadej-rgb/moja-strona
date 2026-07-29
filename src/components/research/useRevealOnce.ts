"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Odpala wejściową animację (opacity/translate) raz, gdy element wejdzie w viewport —
 * przez IntersectionObserver, bez powtarzania przy kolejnym scrollowaniu.
 * Zwraca `ref` do podpięcia pod element oraz `revealed`, które po pierwszym
 * wejściu w viewport zostaje `true` na stałe.
 */
export function useRevealOnce<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  // Zaczyna jako false zarówno na serwerze, jak i na kliencie (przed hydratacją) —
  // inaczej różnica w dostępności IntersectionObserver między SSR (Node, brak API)
  // a przeglądarką powodowała hydration mismatch na atrybucie data-reveal.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, revealed };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
