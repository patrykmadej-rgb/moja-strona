import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pl", "en", "it"],
  defaultLocale: "pl",
  localePrefix: "as-needed",
});
