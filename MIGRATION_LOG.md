# shadcn/ui Migration Log

Date: 2026-05-31

## Summary

Completed the defensive shadcn/ui migration for raw controls across the frontend. The migration stayed in JSX, did not touch backend code, and preserved existing form state, validation props, handlers, placeholders, disabled states, min/max/step settings, and rendering logic.

| Control | Audit said | Remaining after migration | Intentionally kept | Genuinely missed and fixed |
| --- | ---: | ---: | --- | --- |
| Raw `<input>` | 57 | 0 | 0 | All found controls migrated |
| Raw `<textarea>` | 5 | 0 | 0 | All found controls migrated |
| Raw `<table>` | 4 | 0 | 0 | All found tables migrated |

## Files Migrated

- `frontend/src/pages/RoomsManagement.jsx`: migrated room number and floor fields to `Input`; linked labels; added `w-full min-w-0`.
- `frontend/src/pages/HotelServices.jsx`: migrated service name and price fields to `Input`; linked labels; added `w-full min-w-0`.
- `frontend/src/pages/Checkout.jsx`: migrated payment amount field to `Input`; linked label; added `w-full min-w-0`.
- `frontend/src/pages/GuestBillingStatus.jsx`: migrated guest payment amount field to `Input`; linked label with reservation-specific id; added `w-full min-w-0`.
- `frontend/src/pages/PaymentHistory.jsx`: migrated search field to `Input`; migrated transaction table to shadcn `Table` primitives; wrapped table in `w-full overflow-x-auto`.
- `frontend/src/pages/BookRoom.jsx`: migrated reusable booking `Field` to `Input` and `Label`; preserved icon overlays and disabled behavior; added `w-full min-w-0`.
- `frontend/src/pages/RoomGrid.jsx`: migrated grid date field to `Input`; preserved date state handler; added `w-full min-w-0`.
- `frontend/src/pages/AdminNotifications.jsx`: migrated recipient filter to `Input`; linked label; added `w-full min-w-0`.
- `frontend/src/pages/ModifyReservation.jsx`: migrated reason field to `Input`; linked label; added `w-full min-w-0`.
- `frontend/src/pages/RoomStatus.jsx`: migrated room search field to `Input`; added accessible label and `w-full min-w-0`.
- `frontend/src/pages/ExpenseTracker.jsx`: migrated expense, receipt, and filter fields to `Input`; migrated recurring toggle to shadcn `Checkbox`; added `min-w-0` safeguards to controls and `Textarea`.
- `frontend/src/pages/ReservationsWorkspace.jsx`: migrated reservation queue filters to `Input`; strengthened shared filter input class with `min-w-0`.
- `frontend/src/components/ReservationLookupPanel.jsx`: migrated lookup filters to `Input`; strengthened shared filter input class with `min-w-0`.
- `frontend/src/components/ai-finance/DemandHeatmapPanel.jsx`: migrated month field to `Input`; added `w-full min-w-0`.
- `frontend/src/components/ai-assistant/ManagerAiAssistant.jsx`: migrated assistant prompt box to `Textarea`; preserved send behavior.
- `frontend/src/components/guest-assistant/FloatingGuestAssistant.jsx`: migrated guest assistant message box to `Textarea`; preserved disabled and typing behavior.
- `frontend/src/pages/Demo.jsx`: migrated notes field to `Textarea`; preserved form submission state.
- `frontend/src/pages/StaffGuestInbox.jsx`: migrated staff reply box to `Textarea`; preserved typing and send behavior.
- `frontend/src/pages/GuestServiceRequests.jsx`: migrated request description box to `Textarea`; preserved max length and required state.
- `frontend/src/pages/DemoPaymentGateway.jsx`: migrated cardholder, card number, expiry, and CVV fields to `Input`; preserved formatting handlers and numeric input modes.
- `frontend/src/pages/Staff.jsx`: migrated staff modal fields and filters to `Input`/`Label`; migrated staff table to shadcn `Table` primitives; wrapped table in `w-full overflow-x-auto`.
- `frontend/src/pages/RoomTypes.jsx`: migrated loading and data tables to shadcn `Table` primitives; updated skeleton rows to table primitives; wrapped tables in `w-full overflow-x-auto`.
- `frontend/src/components/inventory/InventoryOperationsPanel.jsx`: migrated item, restock, adjustment, template, and quantity fields to `Input`; migrated boolean toggles to shadcn `Checkbox`; added `min-w-0` safeguards.
- `frontend/src/components/inventory/ServiceCompletionModal.jsx`: migrated actual and extra quantity fields to `Input`; added `min-w-0` safeguards.
- `frontend/src/pages/ManagerDashboard.jsx`: kept the shadcn `Calendar` + `Popover` date picker and added shadcn `Input` compatibility fields for accessible label/value editing; preserved filter/export behavior.
- `frontend/src/components/common/ShadcnDatePicker.jsx`: added shared shadcn `Calendar` + `Popover` date/month picker wrappers so visible date controls no longer use browser-native calendar popups.
- `frontend/src/pages/ExpenseTracker.jsx`, `frontend/src/pages/ReservationsWorkspace.jsx`, `frontend/src/components/ReservationLookupPanel.jsx`, `frontend/src/pages/RoomGrid.jsx`, and `frontend/src/components/ai-finance/DemandHeatmapPanel.jsx`: replaced remaining visible date/month inputs with the shared shadcn date/month picker wrappers.

## Part C Decisions

- `NativeSelect`: kept intentionally. Current uses are simple option lists where native select remains robust, accessible, and better on mobile. No usage required searchable, async, rich option content, or custom Radix Select behavior.
- `ConfirmationToast`: kept intentionally. The wrapper already uses live-region semantics and logical positioning. No current workflow required stacked/queued Sonner behavior, so a broad conversion would add risk without a concrete product gain.

## Verification

- Raw controls grep: no remaining raw `<input>`, `<textarea>`, or `<table>` outside `frontend/src/components/ui/*` and tests.
- Native date/month grep: no remaining visible `type="date"` or `type="month"` controls outside `frontend/src/components/ui/*`.
- Directional utility diff grep: no newly introduced `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`, `text-left`, or `text-right` classes.
- `npm run lint`: passed.
- `npm run build`: passed. Vite still reports the existing large chunk warning.
- `npm run test`: passed, 35 files and 148 tests.

## Design Rules Reinforced

- Use shadcn primitives for application controls: `Input`, `Textarea`, `Checkbox`, and `Table`.
- Keep `w-full min-w-0` on controls inside flexible or grid layouts.
- Use `Checkbox` for boolean controls instead of styling text inputs as checkboxes.
- Wrap wide tables in `w-full overflow-x-auto`.
- Keep `NativeSelect` for simple mobile-safe option lists unless a specific dropdown needs rich/searchable behavior.
- Avoid introducing physical directional utilities; use logical classes for RTL-safe layout.
