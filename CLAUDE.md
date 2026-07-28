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
│   └── schema.sql          # Schemat bazy danych (uruchamia się raz w Supabase SQL Editor)
├── src/
│   ├── app/                # Next.js App Router — każdy folder = strona
│   │   ├── layout.tsx      # Główny layout (Navbar + Footer, czcionki, metadane)
│   │   ├── page.tsx        # Strona główna (hero, o mnie, artykuły, badania)
│   │   ├── globals.css     # Globalne style Tailwind
│   │   ├── actions.ts      # Server action: wylogowanie (signOut)
│   │   ├── login/
│   │   │   ├── page.tsx    # Formularz logowania e-mail + hasło
│   │   │   └── actions.ts  # Server action: logowanie (signIn)
│   │   ├── panel/
│   │   │   ├── layout.tsx  # Layout panelu — sprawdza sesję, przekierowuje na /login
│   │   │   ├── page.tsx    # Przegląd panelu (strona startowa po zalogowaniu)
│   │   │   ├── pomysly/
│   │   │   │   ├── page.tsx    # Lista pomysłów na artykuły
│   │   │   │   └── actions.ts  # Dodawanie i usuwanie pomysłów + upload PDF
│   │   │   └── zjazdy/
│   │   │       ├── page.tsx    # Lista zjazdów
│   │   │       └── actions.ts  # Dodawanie, usuwanie i toggle "opłacone"
│   │   └── psychoterapia/
│   │       └── page.tsx    # Strona oferty psychoterapeutycznej
│   ├── components/
│   │   ├── Navbar.tsx      # Górna nawigacja (z dynamicznym linkiem Panel/Zaloguj)
│   │   ├── Footer.tsx      # Stopka
│   │   └── panel/
│   │       ├── IdeaForm.tsx    # Formularz dodawania pomysłu
│   │       ├── TripForm.tsx    # Formularz dodawania zjazdu
│   │       ├── DeleteButton.tsx # Przycisk usuwania (używany w obu modułach)
│   │       └── PaidToggle.tsx  # Checkbox "opłacone" w zjazdach
│   ├── lib/
│   │   ├── site-config.ts  # ⭐ JEDYNE miejsce do zmiany danych osobowych
│   │   ├── types.ts        # Typy TypeScript: ArticleIdea, Trip
│   │   └── supabase/
│   │       ├── client.ts   # Klient Supabase po stronie przeglądarki
│   │       ├── server.ts   # Klient Supabase po stronie serwera (Server Components)
│   │       └── middleware.ts # Odświeżanie sesji + ochrona tras /panel
│   └── proxy.ts            # (pomocniczy plik konfiguracyjny)
├── .env.local              # Klucze Supabase — NIE commitować do GitHuba!
├── next.config.ts          # Konfiguracja Next.js
└── package.json
```

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

### Storage

Bucket `documents` (prywatny) — pliki PDF:
- Ścieżka: `{user_id}/pomysly/{idea_id}-{filename}` lub `{user_id}/zjazdy/{trip_id}-{filename}`
- Dostęp chroniony przez Row Level Security — każdy widzi tylko swoje pliki

### Jak uruchomić schemat (jednorazowo)

Wejdź na: Supabase Dashboard → SQL Editor → New query → wklej zawartość
`supabase/schema.sql` → kliknij „Run"

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

---

## Co pozostało do zrobienia ⬜

### Pilne / do sprawdzenia

- [ ] **Zweryfikować logowanie na produkcji** — sprawdzić, czy Supabase działa
      pod domeną patrykmadej.com (nie tylko na localhost i .vercel.app)
- [ ] **Sprawdzić domenę** — czy `https://patrykmadej.com` już się otwiera
      (może być kwestia propagacji DNS lub certyfikatu SSL)

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
