import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ANIA_AUTH_COOKIE, isAniaAuthCookieValid } from "@/lib/ania-auth";
import { buildAniaPrompt } from "@/lib/ania-master-prompt";

const RATE_LIMIT_MS = 5000;
const GENERATION_TIMEOUT_MS = 60000;
const GENERIC_ERROR = "Nie udało się wygenerować grafiki. Spróbuj ponownie za chwilę.";

let lastRequestAt = 0;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(ANIA_AUTH_COOKIE)?.value;

  if (!isAniaAuthCookieValid(authCookie)) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const now = Date.now();
  if (now - lastRequestAt < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: "Poczekaj chwilę przed kolejnym generowaniem." },
      { status: 429 },
    );
  }
  lastRequestAt = now;

  const body = await request.json().catch(() => null);
  const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!topic || !text) {
    return NextResponse.json(
      { error: "Podaj temat i dokładny tekst do wygenerowania grafiki." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: GENERIC_ERROR, details: "Brak skonfigurowanego klucza OPENAI_API_KEY." },
      { status: 500 },
    );
  }

  const prompt = buildAniaPrompt(topic, text);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt,
        size: "1536x1024",
        quality: "medium",
        n: 1,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const details = data?.error?.message ?? `Błąd OpenAI API (status ${response.status}).`;
      return NextResponse.json({ error: GENERIC_ERROR, details }, { status: 502 });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { error: GENERIC_ERROR, details: "Brak danych obrazu w odpowiedzi API." },
        { status: 502 },
      );
    }

    return NextResponse.json({ image: `data:image/png;base64,${b64}` });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const details = isAbort
      ? "Przekroczono czas oczekiwania na odpowiedź OpenAI."
      : err instanceof Error
        ? err.message
        : String(err);
    return NextResponse.json({ error: GENERIC_ERROR, details }, { status: isAbort ? 504 : 500 });
  } finally {
    clearTimeout(timeout);
  }
}
