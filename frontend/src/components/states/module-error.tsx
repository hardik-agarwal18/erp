"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ModuleError({
  title,
  message,
  retry,
}: {
  title: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/60 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-rose-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>
      {retry ? (
        <Button className="mt-4" onClick={retry} variant="outline">
          Retry
        </Button>
      ) : null}
    </div>
  );
}
