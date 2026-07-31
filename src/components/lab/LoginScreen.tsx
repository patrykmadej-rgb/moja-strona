"use client";

import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loginLab } from "@/app/lab/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 bg-[#4A1D6E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4A2073] disabled:opacity-50"
    >
      {pending ? "Logowanie…" : "Zaloguj"}
    </button>
  );
}

export default function LoginScreen() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F1EC] px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-block text-xs text-[#4A3360] hover:underline"
        >
          ← Wróć na patrykmadej.com
        </Link>
        <Image
          src="/lab/lab-logo.png"
          alt="Pm.lab"
          width={1536}
          height={1024}
          priority
          className="mx-auto h-auto w-full max-w-[400px]"
        />
        <p className="mt-1 text-center text-xs text-[#4A3360]">
          Panel prywatny — dostęp tylko dla właściciela.
        </p>

        <form action={loginLab} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[#1C1028]">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="border border-[#4A1D6E]/30 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[#1C1028]">
              Hasło
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border border-[#4A1D6E]/30 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]"
            />
          </div>

          {error && (
            <p className="bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
