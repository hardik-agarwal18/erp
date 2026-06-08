"use client";

import { createContext, useContext, useMemo, useState } from "react";

type UiStoreValue = {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const UiStoreContext = createContext<UiStoreValue | null>(null);

export function UiStoreProvider({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const value = useMemo(() => ({ commandOpen, setCommandOpen, sidebarOpen, setSidebarOpen }), [commandOpen, sidebarOpen]);
  return <UiStoreContext.Provider value={value}>{children}</UiStoreContext.Provider>;
}

export function useUiStore() {
  const context = useContext(UiStoreContext);
  if (!context) {
    throw new Error("useUiStore must be used within UiStoreProvider");
  }
  return context;
}
