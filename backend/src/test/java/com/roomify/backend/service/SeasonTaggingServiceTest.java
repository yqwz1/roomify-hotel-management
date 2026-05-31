package com.roomify.backend.service;

import com.roomify.backend.dto.ai.SeasonSegment;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for {@link SeasonTaggingService}.
 *
 * The anchor dates are Umm al-Qura ({@code islamic-umalqura}) civil dates and must match
 * the JDK's Hijri calendar — not religiously confirmed sighting dates.
 */
class SeasonTaggingServiceTest {

    private final SeasonTaggingService service = new SeasonTaggingService();

    @Test
    void classifiesKnownAnchorDates() {
        assertEquals(SeasonTaggingService.TYPE_RAMADAN, service.classify(LocalDate.of(2025, 3, 1)));
        assertEquals(SeasonTaggingService.TYPE_HAJJ_ADHA, service.classify(LocalDate.of(2025, 6, 6)));
        assertEquals(SeasonTaggingService.TYPE_EID_FITR, service.classify(LocalDate.of(2026, 3, 20)));
        assertEquals(SeasonTaggingService.TYPE_HAJJ_ADHA, service.classify(LocalDate.of(2026, 5, 27)));
    }

    @Test
    void groupsConsecutiveDaysIntoSegments() {
        // March 2025 contains the whole of Ramadan 1446 (which began 2025-03-01).
        List<SeasonSegment> segments = service.getSeasons(
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31));

        SeasonSegment ramadan = segments.stream()
                .filter(s -> SeasonTaggingService.TYPE_RAMADAN.equals(s.type()))
                .findFirst()
                .orElseThrow();

        assertEquals(LocalDate.of(2025, 3, 1), ramadan.startDate());
        // Ramadan label carries the Hijri year 1446 in Arabic-Indic digits.
        assertEquals("رمضان ١٤٤٦", ramadan.labelAr());
        // The segment is contiguous (single Ramadan run, no gaps).
        assertTrue(ramadan.endDate().isAfter(ramadan.startDate()));
    }

    @Test
    void summerIsTaggedByGregorianMonth() {
        // A plain July day with no Hijri season should be summer.
        assertEquals(SeasonTaggingService.TYPE_SUMMER, service.classify(LocalDate.of(2024, 7, 15)));
    }

    @Test
    void regularDaysProduceNoSegment() {
        // Mid-January with no Hijri season and outside summer.
        List<SeasonSegment> segments = service.getSeasons(
                LocalDate.of(2025, 1, 10), LocalDate.of(2025, 1, 20));
        assertTrue(segments.stream().noneMatch(s -> SeasonTaggingService.TYPE_REGULAR.equals(s.type())));
        assertFalse(segments.stream().anyMatch(
                s -> !s.startDate().isAfter(LocalDate.of(2025, 1, 15))
                        && !s.endDate().isBefore(LocalDate.of(2025, 1, 15))));
    }
}
