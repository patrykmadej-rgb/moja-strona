import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { SessionWarning } from "@/lib/szkola/warnings";

const SEVERITY_STYLES: Record<SessionWarning["severity"], { bg: string; text: string; icon: typeof Info }> = {
  info: { bg: "#eaf0ff", text: "#3564bd", icon: Info },
  uwaga: { bg: "#fff2d9", text: "#a76616", icon: TriangleAlert },
  pilne: { bg: "#fbe9ea", text: "#a13d47", icon: CircleAlert },
};

export default function SessionWarningsCard({ warnings }: { warnings: SessionWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 rounded-[16px] border border-[#e8e2ec] bg-white p-4 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      {warnings.map((warning) => {
        const { bg, text, icon: Icon } = SEVERITY_STYLES[warning.severity];
        return (
          <div key={warning.id} className="flex items-center gap-2.5 rounded-[10px] px-3 py-2" style={{ background: bg }}>
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} style={{ color: text }} />
            <p className="text-sm" style={{ color: text }}>
              {warning.message}
            </p>
          </div>
        );
      })}
    </section>
  );
}
