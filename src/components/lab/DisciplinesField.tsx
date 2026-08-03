import { DISCIPLINES, DISCIPLINE_LABELS, type Discipline } from "@/lib/lab/types";

/**
 * Cztery stałe dyscypliny jako przełączalne chipy (checkboxy stylizowane
 * na pigułki) — natywny multi-checkbox pod wspólną nazwą "disciplines",
 * więc formData.getAll("disciplines") daje od razu tablicę wybranych
 * wartości, bez potrzeby JS-owego stanu ani osobnego komponentu dropdown.
 */
export default function DisciplinesField({ defaultValues }: { defaultValues: Discipline[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DISCIPLINES.map((discipline) => (
        <label key={discipline} className="cursor-pointer">
          <input
            type="checkbox"
            name="disciplines"
            value={discipline}
            defaultChecked={defaultValues.includes(discipline)}
            className="peer sr-only"
          />
          <span className="inline-flex items-center rounded-full border border-[#e6deec] bg-white px-3 py-1.5 text-sm text-[#4f4758] transition-colors peer-hover:border-[#d9cde5] peer-checked:border-[#5b2a86] peer-checked:bg-[#f1eafd] peer-checked:text-[#5b2a86] peer-checked:font-medium peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#5b2a86]/40">
            {DISCIPLINE_LABELS[discipline]}
          </span>
        </label>
      ))}
    </div>
  );
}
