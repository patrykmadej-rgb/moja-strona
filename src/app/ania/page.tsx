import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ANIA_AUTH_COOKIE, isAniaAuthCookieValid } from "@/lib/ania-auth";
import AniaPinForm from "@/components/ania/AniaPinForm";
import AniaGeneratorForm from "@/components/ania/AniaGeneratorForm";

export const metadata: Metadata = {
  title: "Generator grafik",
  robots: { index: false, follow: false },
};

export default async function AniaPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(ANIA_AUTH_COOKIE)?.value;
  const authorized = isAniaAuthCookieValid(authCookie);

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-6 py-16">
      {authorized ? <AniaGeneratorForm /> : <AniaPinForm />}
    </div>
  );
}
