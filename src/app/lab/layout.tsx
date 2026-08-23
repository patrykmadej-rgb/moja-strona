import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/lab/Sidebar";
import LoginScreen from "@/components/lab/LoginScreen";
import LabMobileHeader from "@/components/lab/LabMobileHeader";
import LabBottomNav from "@/components/lab/LabBottomNav";
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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // appleWebApp: iOS ignoruje manifest.json dla "Dodaj do ekranu głównego"
  // (Safari nie wspiera Web App Manifest przy instalacji) — bez tych metatagów
  // PWA na iPhonie otwierałaby się w Safari z paskiem adresu zamiast w trybie
  // pełnoekranowym "standalone".
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lab",
  },
};

// viewportFit: "cover" jest wymagane, żeby env(safe-area-inset-*) w CSS
// (dolna nawigacja mobilna, LabBottomNav) w ogóle zwracało realne wartości
// zamiast 0 — bez tego telefon z notchem/paskiem gestów nie rezerwuje miejsca.
export const viewport: Viewport = {
  themeColor: "#251332",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
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
      className={`${cormorant.variable} ${manrope.variable} lab-root h-full`}
    >
      <body className="lab-body h-full font-[family-name:var(--font-manrope)] antialiased">
        {user ? (
          <>
            {/* Sidebar/header/bottom-nav muszą wszystkie poprzedzać <main> w DOM —
                przy równym z-index CSS maluje późniejsze elementy NAD wcześniejszymi
                (patrz komentarz w globals.css przy .lab-bottom-nav), więc modale
                otwierane w treści strony (zawsze mają wyższy z-index niż tło, ale
                są zagnieżdżone w <main>) muszą być OSTATNIE w DOM, żeby poprawnie
                przykrywały też dolną nawigację/nagłówek, tak jak dziś przykrywają
                Sidebar. */}
            <Sidebar email={user.email} />
            <LabMobileHeader email={user.email} />
            <LabBottomNav />
            <main className="lab-main-content bg-[#F5F1EC]">{children}</main>
          </>
        ) : (
          <LoginScreen />
        )}
      </body>
    </html>
  );
}
