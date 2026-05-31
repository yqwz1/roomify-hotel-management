import { describe, it, expect } from 'vitest';
import i18n from '../i18n';
import { seasonShortLabel, seasonFullLabel, seasonTypeName } from './seasonLabels';

// Backend always sends labelAr with Arabic-Indic digits; the year (Hijri for
// Ramadan/Hajj/Eid, Gregorian for summer) must be preserved — only the digit script
// and the name switch by locale.
const hajj = { type: 'HAJJ_ADHA', labelAr: 'الحج والأضحى ١٤٤٧' };
const ramadan = { type: 'RAMADAN', labelAr: 'رمضان ١٤٤٧' };
const summer = { type: 'SUMMER', labelAr: 'الصيف ٢٠٢٥' };

describe('seasonLabels', () => {
  it('renders transliterated name + Latin digits in English (Hijri year kept)', () => {
    const t = i18n.getFixedT('en');
    expect(seasonShortLabel(hajj, t, 'en')).toBe('Hajj 1447');
    expect(seasonFullLabel(hajj, t, 'en')).toBe('Hajj & Eid al-Adha 1447');
    expect(seasonShortLabel(ramadan, t, 'en')).toBe('Ramadan 1447');
    expect(seasonShortLabel(summer, t, 'en')).toBe('Summer 2025');
    expect(seasonTypeName('EID_FITR', t)).toBe('Eid al-Fitr');
  });

  it('renders Arabic name + Arabic-Indic digits in Arabic (Hijri year kept)', () => {
    const t = i18n.getFixedT('ar');
    expect(seasonShortLabel(hajj, t, 'ar')).toBe('حج ١٤٤٧');
    expect(seasonFullLabel(hajj, t, 'ar')).toBe('الحج والأضحى ١٤٤٧');
    expect(seasonShortLabel(ramadan, t, 'ar')).toBe('رمضان ١٤٤٧');
    expect(seasonShortLabel(summer, t, 'ar')).toBe('صيف ٢٠٢٥');
    expect(seasonTypeName('EID_FITR', t)).toBe('عيد الفطر');
  });
});
