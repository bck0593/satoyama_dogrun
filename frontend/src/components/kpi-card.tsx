export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <article className="section-card p-4">
      <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}
