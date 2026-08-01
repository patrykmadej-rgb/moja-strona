import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Panel i logowanie mają własną obsługę sesji Supabase i nie są tłumaczone.
  if (pathname.startsWith("/panel") || pathname.startsWith("/login")) {
    return updateSession(request);
  }

  // /ania (i jego API) to prywatne, ukryte narzędzie poza systemem next-intl —
  // ma działać dokładnie pod /ania, bez prefiksu językowego.
  if (pathname.startsWith("/ania") || pathname.startsWith("/api/ania")) {
    return NextResponse.next();
  }

  // /api/cron/* (Vercel Cron) — brak sesji użytkownika, autoryzacja przez
  // CRON_SECRET w samym route handlerze. Musi być poza next-intl, inaczej
  // middleware dopisuje prefiks językowy (/pl/api/...) i zwraca 404.
  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  // /api/szkola/* (OAuth Google Calendar) — poza next-intl z tego samego
  // powodu co /api/cron, ale odświeżamy sesję Supabase (callback czyta
  // zalogowanego użytkownika).
  if (pathname.startsWith("/api/szkola")) {
    return updateSession(request);
  }

  // /lab (panel logowania + zarządzania artykułami) też jest poza next-intl,
  // bez prefiksu językowego. Odświeżamy tylko sesję Supabase — bramkę dostępu
  // (zalogowany/niezalogowany) obsługuje sam src/app/lab/layout.tsx, więc tu
  // celowo nie przekierowujemy na /login jak dla /panel.
  if (pathname.startsWith("/lab")) {
    return updateSession(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
