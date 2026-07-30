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

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
