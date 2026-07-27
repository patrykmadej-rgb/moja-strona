import type { Metadata } from "next";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Logowanie",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Logowanie</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Panel prywatny — dostęp tylko dla właściciela strony.
      </p>

      <form action={login} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo ?? "/panel"} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Hasło
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Zaloguj się
        </button>
      </form>
    </div>
  );
}
