function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <dt className="text-sm text-[#706878]">{label}</dt>
      <dd className="text-sm font-medium text-[#201a2b]">{value}</dd>
    </div>
  );
}

export default function ArticleMetricsCard({
  versionsCount,
  sourcesCount,
}: {
  versionsCount: number;
  sourcesCount: number;
}) {
  return (
    <section className="rounded-[16px] border border-[#e6deec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Metryki</h2>
      <dl className="mt-3">
        <MetricRow label="Wersje" value={versionsCount} />
        <MetricRow label="Słowa" value={0} />
        <MetricRow label="Strony" value={0} />
        <MetricRow label="Źródła" value={sourcesCount} />
        <MetricRow label="Współautorzy" value={0} />
      </dl>
    </section>
  );
}
