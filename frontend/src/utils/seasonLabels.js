import { toArabicDigits } from './arabicDigits';

// Season type → translation-key suffix. Colors live in TrendLineChart's SEASON_META;
// this util owns only the localized NAMES and the year-digit handling.
const SEASON_KEY = {
  RAMADAN: 'ramadan',
  HAJJ_ADHA: 'hajj',
  EID_FITR: 'eidFitr',
  SUMMER: 'summer',
};

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

// The backend emits the year in Arabic-Indic digits inside labelAr; normalize to Latin
// first so we can re-render it in the right script per locale.
const toLatinDigits = (value) =>
  String(value ?? '').replace(/[٠-٩]/g, (digit) => String(ARABIC_INDIC.indexOf(digit)));

const isArabic = (language) => String(language ?? '').startsWith('ar');

// The year is the trailing token of labelAr — Hijri for Ramadan/Eid/Hajj, Gregorian for
// summer (decided by the backend). We ONLY swap the digit script by locale; the year
// value itself is never recomputed (Hijri stays Hijri).
const localizedYear = (labelAr, language) => {
  const token = String(labelAr ?? '').trim().split(/\s+/).pop() || '';
  const latin = toLatinDigits(token);
  return isArabic(language) ? toArabicDigits(latin) : latin;
};

const composeName = (segment, t, language, variant) => {
  const key = SEASON_KEY[segment?.type];
  if (!key) return '';
  const name = t(`season.${key}.${variant}`);
  return `${name} ${localizedYear(segment.labelAr, language)}`.trim();
};

// Band label: short transliterated/Arabic name + year (e.g. "Hajj 1447" / "حج ١٤٤٧").
export const seasonShortLabel = (segment, t, language) => composeName(segment, t, language, 'short');

// Tooltip: full name + year (e.g. "Hajj & Eid al-Adha 1447" / "الحج والأضحى ١٤٤٧").
export const seasonFullLabel = (segment, t, language) => composeName(segment, t, language, 'full');

// Legend: full name only, no year.
export const seasonTypeName = (type, t) => {
  const key = SEASON_KEY[type];
  return key ? t(`season.${key}.full`) : '';
};
