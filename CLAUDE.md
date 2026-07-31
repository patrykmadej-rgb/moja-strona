# CLAUDE.md — Dokumentacja projektu moja-strona

> Ten plik służy temu, żeby Claude (AI) mógł szybko zrozumieć projekt
> bez potrzeby wklejania całego kontekstu na nowo przy każdej sesji.

---

## Kim jesteś (właściciel projektu)

Patryk Madej — doktorant prowadzący badania naukowe, jednocześnie w trakcie
szkolenia na psychoterapeutę. Nie jesteś programistą. Proszę o wyjaśnienia
po polsku, prostym językiem, bez żargonu technicznego. Przy każdej komendzie
terminalowej podaj ją dokładnie i powiedz, czego się spodziewać. Pytaj
o zgodę przed dużymi zmianami.

---

## Cel strony

Strona osobista pod domeną **patrykmadej.com** pełniąca dwie funkcje:

**Część publiczna** — wizytówka naukowa i zawodowa:
- informacje o osobie (doktorant + przyszły psychoterapeuta)
- lista artykułów naukowych
- opis prowadzonych badań
- sekcja psychoterapii
- w przyszłości: rezerwacja wizyt online

**Część prywatna** (po zalogowaniu, tylko dla właściciela) — dwa moduły:
1. **Baza pomysłów na artykuły** — tytuł, opis, tagi, plik PDF
2. **Centrum zarządzania zjazdami** — data, numer rezerwacji, bilet PDF,
   kwota, zakwaterowanie, adres, checkbox "opłacone"

**Panel `/lab`** — osobna, większa aplikacja do zarządzania artykułami
naukowymi (nie mylić z `/panel` powyżej — to inny, prostszy moduł).
Szczegóły w sekcji „Panel /lab" poniżej.

---

## Stack techniczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Stylowanie | Tailwind CSS 4 |
| Baza danych + Auth + Storage | Supabase |
| Hosting | Vercel (auto-deploy z GitHuba) |
| Repozytorium | GitHub, repo `moja-strona` |
| Domena | patrykmadej.com (DNS w home.pl) |

---

## Lokalizacja projektu

```
~/projekty/moja-strona
```

---

## Struktura folderów

```
moja-strona/
├── supabase/
│   ├── schema.sql                # Schemat article_ideas + trips (uruchamia się raz)
│   └── migrations/
│       └── 001_lab_schema.sql    # Schemat articles/article_versions/article_sources (panel /lab)
├── src/
│   ├── app/                       # Next.js App Router — każdy folder = strona
│   │   ├── globals.css            # Globalne style Tailwind (współdzielone przez oba "root layouty")
│   │   ├── actions.ts             # Server action: wylogowanie (signOut) — używane w (site)
│   │   ├── (site)/                # GRUPA TRAS: cała "zwykła" strona (Navbar+Footer wspólne)
│   │   │   ├── layout.tsx         # Root layout strony głównej (czcionki Geist, Navbar, Footer)
│   │   │   ├── [locale]/          # next-intl: strona główna, badania, publikacje, psychoterapia...
│   │   │   ├── login/             # Formularz logowania do /panel
│   │   │   ├── panel/             # Panel: pomysły na artykuły + zjazdy (patrz opis niżej)
│   │   │   └── ania/              # Ukryte narzędzie generatora grafik (PIN, nie next-intl)
│   │   └── lab/                   # GRUPA TRAS: panel /lab — WŁASNY root layout, bez Navbar/Footer
│   │       ├── layout.tsx         # Własny <html>/<body>, czcionki Cormorant Garamond + Manrope,
│   │       │                      # sprawdza sesję: brak sesji → LoginScreen, sesja → Sidebar + treść
│   │       ├── page.tsx           # / lab → redirect na /lab/artykuly
│   │       ├── actions.ts         # loginLab, signOutLab
│   │       └── artykuly/
│   │           ├── page.tsx       # Lista artykułów (filtry, wyszukiwarka, sortowanie)
│   │           ├── actions.ts     # createArticle, deleteArticle
│   │           ├── nowy/page.tsx  # Formularz dodawania artykułu
│   │           └── [id]/
│   │               ├── page.tsx    # Widok szczegółowy (pobiera dane, generuje signed URLs)
│   │               └── actions.ts  # updateArticle, addVersion/deleteVersion, add/update/deleteSource
│   ├── components/
│   │   ├── Navbar.tsx      # Górna nawigacja (Panel/Zaloguj, przełącznik języka, ikonka /lab)
│   │   ├── Footer.tsx      # Stopka
│   │   ├── panel/          # Komponenty modułu /panel (IdeaForm, TripForm, DeleteButton, PaidToggle)
│   │   └── lab/            # Komponenty modułu /lab (Sidebar, LoginScreen, ArticleWorkspace,
│   │                       # OverviewTab, VersionsTab, SourcesTab, EditArticleForm, StatusTag...)
│   ├── lib/
│   │   ├── site-config.ts  # ⭐ JEDYNE miejsce do zmiany danych osobowych
│   │   ├── types.ts        # Typy TypeScript: ArticleIdea, Trip (moduł /panel)
│   │   ├── lab/
│   │   │   ├── types.ts    # Typy: Article, ArticleVersion, ArticleSource (moduł /lab)
│   │   │   └── format.ts   # Formatowanie dat i rozmiarów plików
│   │   └── supabase/
│   │       ├── client.ts   # Klient Supabase po stronie przeglądarki
│   │       ├── server.ts   # Klient Supabase po stronie serwera (Server Components)
│   │       └── middleware.ts # Odświeżanie sesji + ochrona tras /panel
│   └── proxy.ts            # Middleware: next-intl dla (site), pomija /panel /login /ania /lab
├── .env.local              # Klucze Supabase — NIE commitować do GitHuba!
├── next.config.ts          # Konfiguracja Next.js
└── package.json
```

**Ważne o strukturze `app/`:** Next.js pozwala mieć więcej niż jeden "root layout"
(własny `<html>/<body>`) tylko wtedy, gdy nie ma zwykłego `app/layout.tsx` na
samej górze — zamiast tego każda grupa tras w nawiasach, np. `(site)/layout.tsx`,
oraz każdy zwykły folder najwyższego poziomu, np. `lab/layout.tsx`, definiuje
własny komplet. Nawiasy w `(site)` są tylko organizacyjne i NIE pojawiają się
w adresie URL — strony w środku nadal mają adresy takie jak wcześniej
(`/panel`, `/login`, `/badania` itd.). Dzięki temu `/lab` może wyglądać
zupełnie inaczej (ciemny sidebar, bez górnego menu strony) bez wpływu na
resztę serwisu. `/api/*` (route handlery) stoją poza obiema grupami — nie
potrzebują layoutu.

---

## Konfiguracja DNS i domena

DNS skonfigurowane w **home.pl** (nie przenosimy NS do Vercela — żeby nie stracić poczty):
- rekord A: `patrykmadej.com` → `216.198.79.1`
- rekord CNAME: `www` → `174d5db34535648c.vercel-dns-017.com`

Vercel pokazuje "Valid Configuration". Adres testowy Vercela: `moja-strona-rho-liard.vercel.app`

---

## Baza danych Supabase

Projekt Supabase: `phgwixlqyoznrkorgmhu.supabase.co`

Klucze są w:
- **lokalnie**: `.env.local` (plik na komputerze, nie w GitHubie)
- **produkcja**: Vercel → Settings → Environment Variables

### Tabele

**`article_ideas`** — pomysły na artykuły:
- `id`, `user_id`, `title`, `description`, `tags[]`, `pdf_path`, `created_at`

**`trips`** — zjazdy:
- `id`, `user_id`, `event_date`, `ticket_reservation_number`, `ticket_pdf_path`,
  `accommodation`, `address`, `cost`, `paid`, `created_at`

**`articles`** — artykuły naukowe (moduł `/lab`):
- `id`, `title`, `language`, `target_journal`, `discipline`, `keywords[]`, `abstract`,
  `status` (pomysl/pisanie/do_wyslania/w_redakcji/recenzja/poprawki/przyjety/opublikowany),
  `progress_percent`, `next_step`, `deadline`, `is_private`, `created_by`,
  `created_at`, `updated_at`

**`article_versions`** — wersje plików artykułu (moduł `/lab`):
- `id`, `article_id`, `version_number`, `file_path`, `file_name`, `file_size_bytes`,
  `notes`, `uploaded_by`, `uploaded_at`

**`article_sources`** — źródła/literatura do artykułu (moduł `/lab`):
- `id`, `article_id`, `author`, `title`, `year`, `publisher_or_journal`, `doi`, `url`,
  `source_type`, `reading_status` (do_przeczytania/w_trakcie/przeczytane), `notes`, `created_at`

Uwaga: RLS dla tych trzech tabel jest na razie oparte tylko o
`auth.role() = 'authenticated'` (bez rozróżniania per-user) — panel `/lab`
jest jednoosobowy. Gdy dojdą kolejni użytkownicy, zawęzić polityki do
`auth.uid() = created_by`, na wzór `article_ideas`/`trips` powyżej.

### Storage

Bucket `documents` (prywatny) — pliki PDF modułu `/panel`:
- Ścieżka: `{user_id}/pomysly/{idea_id}-{filename}` lub `{user_id}/zjazdy/{trip_id}-{filename}`
- Dostęp chroniony przez Row Level Security — każdy widzi tylko swoje pliki

Bucket `article-versions` (prywatny) — pliki wersji artykułów modułu `/lab`:
- Ścieżka: `{article_id}/{version_number}_{filename}`
- Pobieranie WYŁĄCZNIE przez signed URL generowany server-side (ważny 5 minut)

### Jak uruchomić schemat (jednorazowo)

1. Wejdź na: Supabase Dashboard → SQL Editor → New query → wklej zawartość
   `supabase/schema.sql` → kliknij „Run" (moduł `/panel`, jeśli jeszcze nie zrobione)
2. Nowa migracja `supabase/migrations/001_lab_schema.sql` (moduł `/lab`) —
   patrz dokładna instrukcja w sekcji „Panel /lab" niżej

---

## Jak uruchomić stronę lokalnie

1. Otwórz Terminal
2. Wejdź do folderu projektu:
   ```
   cd ~/projekty/moja-strona
   ```
3. Uruchom serwer deweloperski:
   ```
   npm run dev
   ```
4. Otwórz w przeglądarce: `http://localhost:3000`

Strona odświeża się automatycznie przy każdej zmianie pliku.

### Jak zatrzymać serwer

W terminalu naciśnij `Ctrl + C`.

---

## Jak opublikować zmiany (deploy)

Każdy push do GitHuba na gałęzi `main` automatycznie uruchamia nowy deploy na Vercelu.

```bash
# 1. Zaznacz zmienione pliki
git add .

# 2. Zapisz zmiany z opisem
git commit -m "opis zmiany"

# 3. Wyślij na GitHuba (= automatyczny deploy)
git push
```

Po kilku minutach zmiany są na żywo na patrykmadej.com.

---

## Jak podmienić dane osobowe

Otwórz plik `src/lib/site-config.ts` — to jedyne miejsce, gdzie zmieniasz:
- imię i nazwisko (`name`)
- tytuł zawodowy (`title`)
- e-mail kontaktowy (`email`)
- opis strony (`description`)

Na stronie głównej (`src/app/page.tsx`) są pola z komentarzami `// TODO` —
tam podmieniasz artykuły naukowe i tematy badawcze.

---

## Panel /lab — artykuły naukowe

Osobna aplikacja pod adresem `/lab`, z własnym logowaniem, oddzielona wizualnie
i technicznie od reszty strony (patrz uwaga o wielu "root layoutach" wyżej).

- **Logowanie**: konta NIE zakłada się samodzielnie — trzeba je ręcznie
  utworzyć w Supabase Dashboard → Authentication → Users. Logowanie działa
  przez ten sam projekt Supabase co `/panel` (ten sam Auth), więc konto
  założone dla jednego działa też dla drugiego.
- **Wygląd**: ciemny sidebar `#1C1028` z ikonami Tabler — tylko "Artykuły"
  (ikona pliku) jest aktywna i klikalna, reszta to wyszarzone placeholdery
  na przyszłość (Pulpit, Biblioteka, Zadania, Kalendarz, Notatki, Statystyki,
  Ustawienia).
- **Moduł Artykuły** (`/lab/artykuly`): lista z filtrami (statusy pogrupowane
  w "W trakcie" / "Wysłane" / "Opublikowane"), wyszukiwarka, sortowanie,
  formularz dodawania, widok szczegółowy z zakładkami Przegląd/Wersje/Źródła
  (w pełni działające) oraz Harmonogram/Notatki/Pliki (placeholder "wkrótce").
- **Wersje plików**: upload do prywatnego bucketu `article-versions`,
  numeracja wersji auto-inkrementowana, pobieranie wyłącznie przez signed URL
  generowany server-side.
- **Bezpieczeństwo**: brak sesji → cały `/lab` pokazuje tylko ekran logowania
  (bez przekierowania na `/login` — to inny formularz niż `/panel`). Wszystkie
  strony `/lab` mają `noindex, nofollow`. `/lab` jest wyłączony z next-intl
  (bez prefiksów językowych), tak samo jak `/panel`, `/login` i `/ania`.

Ikony: pakiet `@tabler/icons-react` (dodany specjalnie dla `/lab` — reszta
strony używa `lucide-react`). Czcionki `/lab`: Cormorant Garamond (nagłówki)
i Manrope (reszta interfejsu), zaimportowane lokalnie tylko w
`src/app/lab/layout.tsx` — reszta strony ich nie używa.

---

## Co jest zrobione ✅

- Strona zbudowana i opublikowana na Vercelu (`moja-strona-rho-liard.vercel.app`)
- Routing: strona główna, psychoterapia, logowanie, panel
- Autentykacja przez Supabase Auth (e-mail + hasło)
- Middleware chroniący `/panel` — przekierowanie na `/login` gdy niezalogowany
- Moduł pomysłów na artykuły (CRUD + upload PDF)
- Moduł zarządzania zjazdami (CRUD + upload biletu PDF + toggle opłacone)
- Schemat bazy danych z Row Level Security
- Bucket Storage na pliki PDF
- DNS skonfigurowane w home.pl, Vercel pokazuje "Valid Configuration"
- Dark mode (automatyczny, systemowy)
- Fundament panelu `/lab`: logowanie, sidebar, CRUD artykułów + wersje plików
  + źródła (patrz sekcja „Panel /lab" wyżej) — **wymaga jeszcze ręcznego
  uruchomienia migracji SQL i utworzenia bucketu Storage, patrz niżej**

---

## Co pozostało do zrobienia ⬜

### Pilne / do sprawdzenia

- [ ] **Uruchomić migrację `supabase/migrations/001_lab_schema.sql`** i
      utworzyć prywatny bucket `article-versions` — bez tego `/lab` nie
      zadziała w pełni (patrz dokładne kroki na końcu, w podsumowaniu zadania)
- [x] **Zweryfikować logowanie na produkcji** — potwierdzone działające na
      patrykmadej.com. Wcześniej występował błąd 404 "Invalid path specified
      in request URL" — przyczyną była zmienna `NEXT_PUBLIC_SUPABASE_URL`
      w Vercel Environment Variables ustawiona na "REST API URL"
      (`.../rest/v1/`) zamiast na sam adres projektu (`https://xxxx.supabase.co`,
      bez ścieżki). Jeśli błąd 404 przy logowaniu wróci, sprawdź tę zmienną
      w pierwszej kolejności — i pamiętaj, że zmiany `NEXT_PUBLIC_*` w Vercelu
      wymagają ręcznego Redeploy, samo zapisanie nie wystarczy (są "wypiekane"
      w build).
- [x] **Sprawdzić domenę** — `https://patrykmadej.com` działa

### Treść

- [ ] Podmienić dane w `src/lib/site-config.ts` (imię, tytuł, e-mail, opis)
- [ ] Uzupełnić sekcję „O mnie" w `src/app/page.tsx`
- [ ] Dodać prawdziwe artykuły naukowe w `src/app/page.tsx`
- [ ] Dodać prawdziwe tematy badawcze w `src/app/page.tsx`
- [ ] Uzupełnić stronę psychoterapii (`src/app/psychoterapia/page.tsx`)

### Wygląd i funkcje

- [ ] Dopracować wygląd strony głównej
- [ ] Ewentualnie: dodać zdjęcie profilowe
- [ ] W przyszłości: rezerwacja wizyt online (np. Calendly lub własny moduł)
- [ ] W przyszłości: sekcja dla klientów psychoterapii

### Panel prywatny — możliwe ulepszenia

- [ ] Dodać pole "status" do pomysłów na artykuły (np. pomysł / w trakcie / wysłany)
- [ ] Sortowanie/filtrowanie pomysłów po tagach lub statusie
- [ ] Edycja istniejących wpisów (teraz można tylko dodać i usunąć)

---

## Znane kwestie techniczne

- Middleware (`src/lib/supabase/middleware.ts`) chroni trasy `/panel` —
  działa zarówno lokalnie, jak i na produkcji
- Klucze Supabase to `NEXT_PUBLIC_*` — są widoczne w przeglądarce, ale to
  jest celowe i bezpieczne (Supabase projektuje je tak specjalnie)
- Row Level Security w Supabase gwarantuje, że nawet ktoś ze znajomością
  kluczy nie zobaczy cudzych danych
- Plik `.env.local` NIE jest i NIE może być w GitHubie (jest w `.gitignore`)
