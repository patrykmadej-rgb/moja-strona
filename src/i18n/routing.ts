import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pl", "en", "it"],
  defaultLocale: "pl",
  localePrefix: "as-needed",
  // Wyłączone: next-intl domyślnie przekierowuje URL bez prefiksu na podstawie
  // Accept-Language / ciasteczka NEXT_LOCALE, co potrafiło "cofać" świadomy wybór
  // użytkownika w przełączniku języka (kliknięcie PL wracało na EN).
  localeDetection: false,
});
