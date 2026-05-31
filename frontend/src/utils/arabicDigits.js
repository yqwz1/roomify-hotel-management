const WESTERN_TO_ARABIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Converts the Western digits (0–9) in a value to Arabic-Indic digits (٠–٩).
 * Non-digit characters are left untouched, so it is safe to run on labels that
 * are already localized. Returns an empty string for null/undefined.
 */
export const toArabicDigits = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[0-9]/g, (digit) => WESTERN_TO_ARABIC[Number(digit)]);
};
