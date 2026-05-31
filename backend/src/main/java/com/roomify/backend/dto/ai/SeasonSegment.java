package com.roomify.backend.dto.ai;

import java.time.LocalDate;

/**
 * A contiguous range of days that all belong to the same recurring Hijri/Gregorian
 * season, used to overlay shaded bands on the historical analytics charts.
 *
 * <p>These are CIVIL/approximate calendar dates derived from the JDK's Umm al-Qura
 * ({@code islamic-umalqura}) Hijri calendar, not religiously confirmed moon-sighting
 * dates. They are intended as historical season markers only.</p>
 *
 * @param type      season type: RAMADAN, EID_FITR, HAJJ_ADHA, or SUMMER
 * @param labelAr   Arabic label including the calendar year, e.g. {@code "رمضان ١٤٤٧"}
 * @param startDate first day of the segment (inclusive)
 * @param endDate   last day of the segment (inclusive)
 */
public record SeasonSegment(
        String type,
        String labelAr,
        LocalDate startDate,
        LocalDate endDate) {
}
