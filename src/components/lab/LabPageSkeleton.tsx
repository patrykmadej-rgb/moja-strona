/**
 * Lekki skeleton zamiast pustego ekranu podczas ładowania danych strony
 * (sekcja 7 briefu — poprawa POSTRZEGANEJ wydajności: użytkownik od razu
 * widzi zarys interfejsu zamiast białej strony, nawet gdy zapytania do
 * Supabase jeszcze trwają). Next.js App Router renderuje to automatycznie
 * z plików loading.tsx, dopóki odpowiadający Server Component (page.tsx)
 * nie skończy pobierania danych — bez żadnej dodatkowej logiki po naszej
 * stronie. Czysto wizualne, generyczne (rząd kart) — celowo nie próbuje
 * imitować każdej strony 1:1, żeby nie utrzymywać osobnego skeletonu dla
 * każdego modułu.
 */
export default function LabPageSkeleton() {
  return (
    <div className="min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] animate-pulse px-8 pt-9 pb-16">
        <div className="h-4 w-24 rounded-full bg-[#e8e2ec]" />
        <div className="mt-3 h-8 w-56 rounded-[8px] bg-[#e8e2ec]" />
        <div className="mt-8 flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-[12px] border border-[#e8e2ec] bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
