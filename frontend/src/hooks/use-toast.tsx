"use client";

import { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

export type Toast = {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
};

// Kept for backwards compatibility but it doesn't do anything since Sonner handles state globally
export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useToast() {
  const toast = (props: Toast) => {
    switch (props.variant) {
      case "destructive":
        sonnerToast.error(props.title, { description: props.description });
        break;
      case "success":
        sonnerToast.success(props.title, { description: props.description });
        break;
      case "warning":
        sonnerToast.warning(props.title, { description: props.description });
        break;
      default:
        sonnerToast(props.title, { description: props.description });
        break;
    }
  };

  return { toast, toasts: [] };
}
