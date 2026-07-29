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
  const [revealed, setRevealed] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (revealed) return;
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
