import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/lab/Sidebar";
import LoginScreen from "@/components/lab/LoginScreen";
import "../globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Lab",
    template: "%s · Lab",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="pl"
      className={`${cormorant.variable} ${manrope.variable} h-full`}
    >
      <body className="h-full font-[family-name:var(--font-manrope)] antialiased">
        {user ? (
          <div className="flex h-full min-h-screen bg-[#F5F1EC]">
            <Sidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        ) : (
          <LoginScreen />
        )}
      </body>
    </html>
  );
}
