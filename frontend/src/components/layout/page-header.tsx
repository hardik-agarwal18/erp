import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Workspace module</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions ?? (
          <Button size="sm" variant="outline">
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
