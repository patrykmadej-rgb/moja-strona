import { NextResponse } from "next/server";
import { createAniaAuthCookie, isAniaPinValid } from "@/lib/ania-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!process.env.ANIA_PIN || !pin || !isAniaPinValid(pin)) {
    return NextResponse.json({ error: "Nieprawidłowy PIN." }, { status: 401 });
  }

  const { name, value, ...options } = createAniaAuthCookie();
  const response = NextResponse.json({ success: true });
  response.cookies.set(name, value, options);
  return response;
}
