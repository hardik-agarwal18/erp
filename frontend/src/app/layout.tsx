import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import { UiStoreProvider } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ToastProvider } from "@/hooks/use-toast";
import { ThemeProvider } from "@/providers/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Precision Ledger ERP",
  description: "Accounting and inventory ERP SaaS frontend generated from Stitch designs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, "font-sans")}>
        <QueryProvider>
          <WorkspaceProvider>
            <UiStoreProvider>
              <ToastProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                  <Toaster />
                </ThemeProvider>
              </ToastProvider>
            </UiStoreProvider>
          </WorkspaceProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
