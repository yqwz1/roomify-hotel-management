package com.roomify.backend.service;

import com.roomify.backend.dto.ai.SeasonSegment;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.chrono.Chronology;
import java.time.chrono.HijrahChronology;
import java.time.chrono.HijrahDate;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.List;

/**
 * Classifies calendar dates into recurring seasons and groups consecutive days of
 * the same season into ranges ("segments") suitable for Recharts {@code ReferenceArea}
 * overlays on the historical analytics charts.
 *
 * <p>Hijri seasons are computed from the JDK's Umm al-Qura ({@code islamic-umalqura})
 * calendar. The summer break is purely Gregorian (school holidays). Hijri seasons take
 * priority over summer when they overlap. All values are computed on the fly — there is
 * no persistence and no DB access.</p>
 *
 * <p>These are CIVIL/approximate dates, not religiously confirmed moon-sighting dates.</p>
 */
@Service
public class SeasonTaggingService {

    // ── Season type identifiers (kept in sync with the frontend) ──────────────
    public static final String TYPE_RAMADAN = "RAMADAN";
    public static final String TYPE_EID_FITR = "EID_FITR";
    public static final String TYPE_HAJJ_ADHA = "HAJJ_ADHA";
    public static final String TYPE_SUMMER = "SUMMER";
    public static final String TYPE_REGULAR = "REGULAR";

    // ── Hijri month numbers ───────────────────────────────────────────────────
    private static final int RAMADAN_MONTH = 9;       // Ramadan (all days)
    private static final int SHAWWAL_MONTH = 10;      // Eid al-Fitr falls early in Shawwal
    private static final int DHUL_HIJJAH_MONTH = 12;  // Hajj / Eid al-Adha

    // ── Day thresholds (inclusive) — easy to tweak ───────────────────────────
    private static final int EID_FITR_LAST_DAY = 3;   // Shawwal 1–3
    private static final int HAJJ_ADHA_LAST_DAY = 13; // Dhul-Hijjah 1–13

    // ── Summer = Gregorian school break (Jun–Aug) ────────────────────────────
    private static final int SUMMER_START_MONTH = 6;
    private static final int SUMMER_END_MONTH = 8;

    /**
     * The JDK's Umm al-Qura Hijri calendar, resolved explicitly by its CLDR calendar
     * type so we never pick up a different Hijri variant.
     */
    private static final HijrahChronology UMM_AL_QURA =
            (HijrahChronology) Chronology.of("islamic-umalqura");

    private static final char ARABIC_ZERO = '٠'; // ٠

    /**
     * Returns the list of seasonal segments overlapping the inclusive range
     * {@code [from, to]}. Consecutive days sharing the same type and label are merged
     * into a single segment. Days that match no season produce no segment.
     */
    public List<SeasonSegment> getSeasons(LocalDate from, LocalDate to) {
        List<SeasonSegment> segments = new ArrayList<>();
        if (from == null || to == null || from.isAfter(to)) {
            return segments;
        }

        String currentType = null;
        String currentLabel = null;
        LocalDate segmentStart = null;
        LocalDate previous = null;

        LocalDate cursor = from;
        while (!cursor.isAfter(to)) {
            String type = classify(cursor);
            if (TYPE_REGULAR.equals(type)) {
                if (currentType != null) {
                    segments.add(new SeasonSegment(currentType, currentLabel, segmentStart, previous));
                    currentType = null;
                }
            } else {
                String label = labelFor(type, cursor);
                boolean sameRun = type.equals(currentType) && label.equals(currentLabel);
                if (!sameRun) {
                    if (currentType != null) {
                        segments.add(new SeasonSegment(currentType, currentLabel, segmentStart, previous));
                    }
                    currentType = type;
                    currentLabel = label;
                    segmentStart = cursor;
                }
            }
            previous = cursor;
            cursor = cursor.plusDays(1);
        }

        if (currentType != null) {
            segments.add(new SeasonSegment(currentType, currentLabel, segmentStart, previous));
        }
        return segments;
    }

    /**
     * Classifies a single date into a season type. Hijri seasons are evaluated before the
     * Gregorian summer so they win on overlap. Returns {@link #TYPE_REGULAR} when nothing
     * matches.
     */
    public String classify(LocalDate date) {
        HijrahDate hijri = UMM_AL_QURA.date(date);
        int hijriMonth = hijri.get(ChronoField.MONTH_OF_YEAR);
        int hijriDay = hijri.get(ChronoField.DAY_OF_MONTH);

        if (hijriMonth == RAMADAN_MONTH) {
            return TYPE_RAMADAN;
        }
        if (hijriMonth == SHAWWAL_MONTH && hijriDay <= EID_FITR_LAST_DAY) {
            return TYPE_EID_FITR;
        }
        if (hijriMonth == DHUL_HIJJAH_MONTH && hijriDay <= HAJJ_ADHA_LAST_DAY) {
            return TYPE_HAJJ_ADHA;
        }

        int gregorianMonth = date.getMonthValue();
        if (gregorianMonth >= SUMMER_START_MONTH && gregorianMonth <= SUMMER_END_MONTH) {
            return TYPE_SUMMER;
        }
        return TYPE_REGULAR;
    }

    /**
     * Builds the Arabic label for a season on a given day. Hijri seasons carry the Hijri
     * year; summer carries the Gregorian year. Years are rendered in Arabic-Indic digits.
     */
    private String labelFor(String type, LocalDate date) {
        return switch (type) {
            case TYPE_RAMADAN -> "رمضان " + toArabicDigits(hijriYear(date));
            case TYPE_EID_FITR -> "عيد الفطر " + toArabicDigits(hijriYear(date));
            case TYPE_HAJJ_ADHA -> "الحج والأضحى " + toArabicDigits(hijriYear(date));
            case TYPE_SUMMER -> "الصيف " + toArabicDigits(date.getYear());
            default -> "";
        };
    }

    private int hijriYear(LocalDate date) {
        return UMM_AL_QURA.date(date).get(ChronoField.YEAR);
    }

    /** Converts a non-negative integer to Arabic-Indic digits (٠–٩). */
    private static String toArabicDigits(int value) {
        char[] western = Integer.toString(value).toCharArray();
        StringBuilder sb = new StringBuilder(western.length);
        for (char c : western) {
            sb.append((char) (ARABIC_ZERO + (c - '0')));
        }
        return sb.toString();
    }
}
