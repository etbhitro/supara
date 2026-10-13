export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-stone-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-muted-200">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
