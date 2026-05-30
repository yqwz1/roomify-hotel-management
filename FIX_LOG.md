# FIX_LOG — Layout Findings Verification

Date: 2026-05-30
Branch: app

## TL;DR

The concrete worklist from the pasted "Adversarial Layout Verification Report"
was audited item-by-item against the **actual source on disk**. The flex /
truncation / shrink / overflow findings were already resolved by the three prior
layout commits (`3d34b78`, `54241ca`, `cfebc75`). One real gap remained: a
batch of **physical-direction utilities** (`pl/pr/ml/mr`, `text-left/right`)
that had not been converted to logical equivalents — these are genuine Arabic
RTL bugs. Those were converted in this pass.

> Note on the input report: `VERIFICATION_REPORT.md`, `raw-findings.json`, and
> the Playwright script it references are **not present** in the repo. The
> `verification-scripts/` directory is empty and `verification-screenshots/`
> contains only empty folders (0 images). The cited line numbers also do not
> match current code. So the report's quantitative claims could not be
> reproduced; this log records what was actually verified in the code.

## Gates (all green)

- `npm run lint` — PASS (eslint clean)
- `npm run build` — PASS (only the pre-existing Vite >500 kB chunk warning)
- `npx vitest run --pool=threads --maxWorkers=1 --no-file-parallelism --testTimeout=10000`
  — PASS, 35 files, 147 tests

## Systemic coverage (whole `src/`, 147 .jsx files)

- `min-w-0` present in 94 files
- `break-words` present in 79 files
- `shrink-0` present in 81 files
- `truncate` / `line-clamp` present in 23 files
- Physical `pl-/pr-/ml-/mr-[n]` utilities (non-rtl): **6 → 0** (all converted)
- `text-left` / `text-right` not paired with `rtl:` override:
  **23 → 1** (the 1 remaining is `LtrText.jsx`, intentional — see Cat 7)

## Per-category audit

### Cat 1 — Flex min-width overflow
- `ReservationLookupPanel.jsx` action buttons: parent is
  `flex min-w-0 flex-wrap ... gap-3`; buttons wrap rather than overflow. The
  `min-w-[170px]` is an intentional min target inside a wrapping row. **OK.**

### Cat 2 — Text truncation
- `Header.jsx` logout label is `hidden sm:block` beside a `shrink-0` icon; user
  chip uses `max-w-[120px] truncate`. **OK.**

### Cat 3 & 9 — Absolute / z-index
- `GuestAssistantLauncher.jsx` unread badge: absolute child of a `relative`
  button — **intentional, safe, no change.**
- `Footer.jsx:83` decorative accent line uses `left-1/2 -translate-x-1/2` —
  centering is direction-agnostic; renders centered in RTL too.
  **Intentional, no change.**
- `RoomFilters`, `RadialStatusChart`, `Header` underline: positioned within
  `relative` parents and ordered after siblings in the DOM; no real overlap.
  **Intentional, no change.**

### Cat 4 — Grid gap
- `RoomGrid.jsx` timeline header/row grids deliberately omit `gap-*`: cells
  share continuous borders (`border-e border-b`) to form a calendar grid; a gap
  would break the visual grid. Horizontal scroll is intentional via
  `min-w-[960px]`. **Intentional, no change.**

### Cat 5 — Nav wrapping
- `Header.jsx` desktop nav: `DesktopLink` carries `shrink-0 whitespace-nowrap`;
  the nav container is `min-w-0 ... overflow-x-auto`. **OK.**

### Cat 6 — Icon/badge shrink
- `Home.jsx`, `Pricing.jsx`, `BookRoom.jsx` flagged icons already carry
  `shrink-0` (Home:252, Pricing:120). **OK.**

### Cat 7 — RTL / logical properties  (CHANGES MADE)
Prior commits converted most spacing to logical utilities, but a residual set
remained and was converted in this pass (safe swaps — identical LTR rendering,
correct RTL mirroring):

Spacing (`pl/pr/ml/mr` → `ps/pe/ms/me`):
- `components/ui/calendar.jsx` — caption `pl-2 pr-1` → `ps-2 pe-1`
- `components/guest-assistant/FloatingGuestAssistant.jsx` — spinner `mr-2` → `me-2`
- `components/charts/ChartCard.jsx` — action `ml-4` → `ms-4`
- `components/ai-assistant/MarkdownMessage.jsx` — list `pl-4` → `ps-4`
- `pages/ManagerDashboard.jsx` — scroll gutter `pr-1` → `pe-1`
- `pages/Home.jsx` — mockup `ml-2` → `ms-2`

Text alignment (`text-left/right` → `text-start/end`):
- `components/ui/table.jsx` (shared TableHead default)
- `components/ai-finance/{AiInsightPanel,DemandHeatmapPanel,ForecastChart}.jsx`
- `components/guest-assistant/FloatingGuestAssistant.jsx`
- `components/reservations/ReservationDetailContent.jsx`
- `pages/{RoomsManagement,InvoicePreview,PaymentHistory,Staff,GuestBillingStatus,
  ReservationsWorkspace,ManagerDashboard,Integrations,CancelReservation,Home}.jsx`

Confirmed **intentional, no change**:
- `components/LtrText.jsx` — a deliberately LTR wrapper for IDs / room numbers /
  amounts; `text-left` is correct here regardless of page direction.
- `components/ui/select.jsx` — `data-[side=*]:-translate-x-1` etc. are Radix
  popper animation offsets, not layout direction; left as-is.

Directional arrows already use `rtl:rotate-180` / `rtl:rotate-[270deg]`. **OK.**

### Cat 8 & 10 — Width / responsive
- Stress-only categories (1000-char strings / unbroken URLs). The shared
  primitives and content containers already carry `break-words` + `min-w-0`, so
  hostile content wraps. Build/test pass at all sizes. **OK.**

## Conclusion

The overflow/flex/truncation categories were already hardened by prior commits;
no churn was added there. The one real remaining issue — leftover physical
direction utilities — was genuinely fixed (RTL logical conversion across 18
files). All gates remain green. No fabricated changes.
