package com.roomify.backend.service;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class BookingUtilsTest {

    private final BookingUtils utils = new BookingUtils();

    @Test
    @DisplayName("تطابق كامل للمواعيد - Exact Match")
    void testExactMatch() {
        assertTrue(utils.isOverlapping(
            LocalDate.of(2026, 2, 20), LocalDate.of(2026, 2, 25),
            LocalDate.of(2026, 2, 20), LocalDate.of(2026, 2, 25)
        ));
    }

    @Test
    @DisplayName("تداخل جزئي - Partial Overlap")
    void testPartialOverlap() {
        assertTrue(utils.isOverlapping(
            LocalDate.of(2026, 2, 18), LocalDate.of(2026, 2, 21),
            LocalDate.of(2026, 2, 20), LocalDate.of(2026, 2, 25)
        ));
    }

    @Test
    @DisplayName("حجز داخل حجز آخر - Fully Contained")
    void testFullyContained() {
        assertTrue(utils.isOverlapping(
            LocalDate.of(2026, 2, 21), LocalDate.of(2026, 2, 23),
            LocalDate.of(2026, 2, 20), LocalDate.of(2026, 2, 25)
        ));
    }

    @Test
    @DisplayName("حالات الحدود - Boundary Case (No Overlap)")
    void testBoundaryCase() {
        assertFalse(utils.isOverlapping(
            LocalDate.of(2026, 2, 25), LocalDate.of(2026, 2, 28),
            LocalDate.of(2026, 2, 20), LocalDate.of(2026, 2, 25)
        ));
    }
}