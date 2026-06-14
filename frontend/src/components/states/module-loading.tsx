export function ModuleLoading({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-80 animate-pulse rounded bg-slate-100" />
      <div className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border bg-card text-card-foreground dark:border-slate-800 dark:bg-slate-950" />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-xl border bg-card text-card-foreground dark:border-slate-800 dark:bg-slate-950" />
    </div>
  );
}
