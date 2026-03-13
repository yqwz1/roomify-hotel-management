# Day 2 QA Rules Checklist and Test Plan

Date: March 12, 2026  
Owner: Muaz (QA / Test Owner)

## Purpose
Prepare a test-ready checklist and case matrix for:
- checkout
- billing
- invoice
- payment failure
- room-status control

This document covers current behavior already in backend tests and planned Day 2 checks for missing financial/checkout APIs.

## Scope Baseline (as of March 12, 2026)
- Implemented and test-covered: reservation create, modify, cancel, check-in.
- Implemented and test-covered: reservation status transition guards around modify/cancel/check-in.
- Implemented and test-covered: room transition guard `OCCUPIED -> AVAILABLE` blocked.
- Implemented and test-covered: shared `ApiError` format for `400/401/403/404/409/422/503`.
- Not implemented yet (plan only): reservation checkout API/workflow.
- Not implemented yet (plan only): billing ledger/outstanding balance model.
- Not implemented yet (plan only): invoice generation/finalization endpoint.
- Not implemented yet (plan only): payment processing endpoint and provider failure handling.

## Rules Checklist

### 1) Checkout Validation Rules
- Reservation must exist.
- Reservation must be in `CHECKED_IN`.
- Room must currently be `OCCUPIED`.
- Outstanding balance must be `0.00` before checkout is accepted.
- Final invoice must be present and finalized before checkout.
- Checkout request must be idempotent, so repeating success does not double-charge or duplicate invoice/payment entries.
- On success, reservation status must transition `CHECKED_IN -> CHECKED_OUT`.
- On success, room status must transition `OCCUPIED -> NEEDS_CLEANING`.
- On success, actual checkout timestamp must be persisted.

### 2) Billing Rules
- Nights must always be computed as `checkOutDate - checkInDate` and be `> 0`.
- `roomRate`, `subtotal`, `taxes`, `totalPrice` must use scale `2` with `HALF_UP` rounding.
- Calculation formula must be consistent: `subtotal = roomRate * nights`.
- Calculation formula must be consistent: `taxes = subtotal * taxRate`.
- Calculation formula must be consistent: `total = subtotal + taxes + extraCharges - discounts`.
- Outstanding balance must be `max(total - totalPaid, 0.00)`.
- Outstanding balance must never be negative.
- Reservation modification must recalculate totals.
- Cancellation after payment must create a financial reversal rule (refund or credit note) and keep an auditable trail.

### 3) Invoice Rules
- One active invoice per reservation version.
- Invoice line items must sum exactly to invoice subtotal and total.
- Invoice total must equal reservation total at checkout time.
- Finalized invoice fields (totals, tax, confirmation number, timestamps) are immutable.
- Reissuing invoice after modification must produce new version/reference and preserve history.

### 4) Payment Failure Rules
- Declined payment blocks checkout.
- Timed-out payment blocks checkout until payment state is resolved.
- Payment provider unavailability must not change reservation/room state.
- Duplicate payment callback/request must be idempotent by transaction id.
- Partial payment keeps reservation in non-checkout state with positive outstanding balance.

### 5) Room-Status Control Rules
- Check-in requires room `AVAILABLE`; successful check-in sets room to `OCCUPIED`.
- Direct `OCCUPIED -> AVAILABLE` transition is invalid and must return `422`.
- Checkout must set `OCCUPIED -> NEEDS_CLEANING`.
- Only housekeeping/manager flow may set `NEEDS_CLEANING -> AVAILABLE`.
- Maintenance transition `AVAILABLE -> UNDER_MAINTENANCE` is allowed.
- Maintenance transition `OCCUPIED -> UNDER_MAINTENANCE` is blocked.

## Happy-Path Test Cases (Day 2 Ready)

| ID | Flow | Preconditions | Expected Result |
|---|---|---|---|
| HP-01 | Create reservation pricing | Valid room, valid dates, no overlap | `201`, reservation created, pricing fields correct |
| HP-02 | Check-in success | Reservation `CONFIRMED`, date reached, room `AVAILABLE` | `200`, reservation `CHECKED_IN`, room `OCCUPIED` |
| HP-03 | Modify reservation success | Reservation `CONFIRMED`, valid reason, no overlap | `200`, dates/room updated, totals recalculated |
| HP-04 | Cancel success | Reservation `PENDING` or `CONFIRMED` | `200`, status `CANCELLED`, cancellation timestamp stored |
| HP-05 | Checkout success (planned) | Reservation `CHECKED_IN`, outstanding `0.00`, invoice finalized | `200`, reservation `CHECKED_OUT`, room `NEEDS_CLEANING` |
| HP-06 | Invoice generation (planned) | Reservation has final billable data | `201/200`, invoice created with matching totals and line items |
| HP-07 | Payment success then checkout (planned) | Outstanding balance > `0`, valid payment approved | Payment `200`, outstanding becomes `0.00`, checkout allowed |
| HP-08 | Housekeeping completion (planned) | Room `NEEDS_CLEANING` after checkout | `200`, room moves to `AVAILABLE` |

## Edge-Case and Blocking Test Cases

| ID | Condition | Expected API Status | Blocking/Error Expectation |
|---|---|---|---|
| EC-01 | Create/modify with invalid date range (`checkOut <= checkIn`) | `400` | Validation error, no state change |
| EC-02 | Create/modify overlap conflict | `409` | Conflict error, reservation unchanged |
| EC-03 | Modify when status is `CANCELLED` | `409` | "Cannot modify reservation in status: CANCELLED" |
| EC-04 | Modify when status is `CHECKED_IN`/`CHECKED_OUT` | `409` | Blocked state transition |
| EC-05 | Cancel when status is `CHECKED_IN`/`CHECKED_OUT` | `409` | Blocked cancellation |
| EC-06 | Check-in when reservation not `CONFIRMED` | `409` | "Only CONFIRMED reservations can be checked in" |
| EC-07 | Check-in when room not ready | `409` | "Room not ready" |
| EC-08 | Checkout from non-`CHECKED_IN` state (planned) | `409` | Block checkout, keep reservation/room unchanged |
| EC-09 | Checkout with unpaid balance (planned) | `409` | Block checkout, return outstanding amount in message/details |
| EC-10 | Checkout without finalized invoice (planned) | `409` | Block checkout until invoice finalization |
| EC-11 | Payment declined (planned) | `409` | Block checkout, payment marked `FAILED` |
| EC-12 | Payment provider timeout/unavailable (planned) | `503` | No status mutation, retry allowed |
| EC-13 | Duplicate payment callback (planned) | `200` | Idempotent response, no duplicate ledger entries |
| EC-14 | Invoice line-item sum mismatch (planned) | `422` | Reject invoice finalization |
| EC-15 | Negative or inconsistent totals (planned) | `422` | Reject calculation payload, no persistence |
| EC-16 | Invalid room transition `OCCUPIED -> AVAILABLE` | `422` | "Cannot change status from OCCUPIED to AVAILABLE directly" |

## Expected API Error Contract

All blocking responses should follow:
- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `validationErrors` (for validation only)

Status code policy for this plan:
- `400` invalid input/validation
- `401` unauthenticated
- `403` unauthorized role
- `404` reservation/room/invoice/payment not found
- `409` business conflict (invalid lifecycle state, unpaid balance, overlap)
- `422` invalid domain transition or calculation integrity violation
- `503` external dependency unavailable (email/payment provider)

## Day 2 Implementation Sequence

1. Add integration tests first for checkout blocking rules (`EC-08`, `EC-09`, `EC-10`).
2. Add unit tests for billing and invoice calculations (`HP-05`, `HP-06`, `EC-14`, `EC-15`).
3. Add payment failure/idempotency integration tests (`EC-11`, `EC-12`, `EC-13`).
4. Add room-turnover transition tests (`HP-08`, `EC-16`).
5. Verify `ApiError` payload consistency for every blocking branch.

## Existing Evidence Linked to Current Coverage
- `ReservationServiceTest`
- `ReservationIntegrationTest`
- `RoomServiceTest`
- `RoomIntegrationTest`

This plan is implementation-ready for Day 2 and explicitly covers invalid states, unpaid balance handling, bad transitions, and calculation integrity.
