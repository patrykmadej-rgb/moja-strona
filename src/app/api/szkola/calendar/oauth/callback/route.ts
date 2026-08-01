import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken } from "@/lib/szkola/calendarCrypto";
import { exchangeCodeForTokens, GOOGLE_CALENDAR_SCOPE } from "@/lib/szkola/googleCalendar";

const STATE_COOKIE = "google_calendar_oauth_state";
const KALENDARZ_URL = "/lab/szkola/kalendarz";

function redirectWithError(request: NextRequest, code: string) {
  const response = NextResponse.redirect(new URL(`${KALENDARZ_URL}?calendar_error=${code}`, request.url));
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/lab", request.url));
  }

  const params = request.nextUrl.searchParams;
  const googleError = params.get("error");
  if (googleError) {
    return redirectWithError(request, "access_denied");
  }

  const code = params.get("code");
  const state = params.get("state");
  const storedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithError(request, "invalid_state");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return redirectWithError(request, "no_refresh_token");
    }

    const admin = createAdminClient();
    const { error } = await admin.from("school_calendar_connections").upsert(
      {
        user_id: user.id,
        provider: "google",
        connection_type: "google_oauth",
        scope: tokens.scope ?? GOOGLE_CALENDAR_SCOPE,
        access_token_encrypted: encryptToken(tokens.access_token),
        refresh_token_encrypted: encryptToken(tokens.refresh_token),
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        sync_enabled: true,
        sync_frequency: "weekly",
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

    if (error) throw new Error(error.message);

    const response = NextResponse.redirect(new URL(`${KALENDARZ_URL}?connected=1`, request.url));
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch {
    return redirectWithError(request, "token_exchange_failed");
  }
}
