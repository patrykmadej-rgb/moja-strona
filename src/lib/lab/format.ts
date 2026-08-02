export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateMedium(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Kolumny typu `date` w Postgresie zwracają "YYYY-MM-DD" bez informacji
// o strefie czasowej — `new Date(str)` interpretuje to jako UTC-północ,
// co przy formatowaniu w strefach "za UTC" (np. Ameryki) potrafi cofnąć
// wyświetlaną datę o jeden dzień. Parsujemy ręcznie jako datę lokalną.
function parseDateOnly(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(dateOnly: string): string {
  return parseDateOnly(dateOnly).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatShortDate(dateOnly: string): string {
  return parseDateOnly(dateOnly).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}

export function todayDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function fileKindLabel(fileName: string | null): string {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "docx" || ext === "doc") return "DOCX";
  if (ext === "pdf") return "PDF";
  return ext ? ext.toUpperCase() : "Plik";
}
