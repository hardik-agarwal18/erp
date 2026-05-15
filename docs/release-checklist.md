# Release Checklist

## 1. Technical Validation
- [ ] **TypeScript Check:** `npx tsc --noEmit` returns 0 errors.
- [ ] **ESLint Check:** `npm run lint` completes without critical warnings.
- [ ] **Build Validation:** `npm run build` successfully compiles the Next.js/Vite bundle without out-of-memory errors.
- [ ] **Environment Variables:** All `.env.production` keys (API URIs, Auth Endpoints) are verified and injected correctly.
- [ ] **Production Build Verified:** `npm run start` successfully serves the production bundle locally without crash loops.

## 2. UX Validation
- [ ] **Dashboard:** KPIs load, SVG Charts render, skeleton states fire properly.
- [ ] **Inventory:** DataTable sorting functions, quick filters isolate correct categories.
- [ ] **Sales:** Order tabs isolate correctly, invoices table responds to client-side sorting.
- [ ] **Purchasing:** Vendor performance widgets render, table actions drop down properly.
- [ ] **Accounting:** Transaction Ledger search works, ActionList handles exceptions cleanly.
- [ ] **Reports:** Catalog filters function, "Generate" button cycles through Loading -> Ready states safely.

## 3. Accessibility Validation
- [ ] **Keyboard Navigation:** User can tab through the AppShell, Navbar, and Sidebar sequentially without losing focus visibility.
- [ ] **Focus States:** Shadcn default focus rings (`ring-ring`) trigger correctly on all interactive row elements in DataTables.
- [ ] **Contrast Ratios:** All semantic tokens (`bg-card`, `text-muted-foreground`) pass WCAG AA.
- [ ] **Screen Readers:** Empty states declare headers clearly; primary application `main` wrapper possesses proper semantics.

## 4. Dark Mode Validation
- [ ] **Tables:** Row hover states (`hover:bg-muted/50`) distinguish clearly against `bg-card`.
- [ ] **KPI Cards:** Text contrast against pure dark mode borders is fully legible.
- [ ] **Charts:** Axes and gridlines use muted colors that do not clash.
- [ ] **Forms:** Background inputs remain dark, text remains light.
- [ ] **Selects:** Native selects (post-hotfix) drop their white background in favor of `bg-background`.
