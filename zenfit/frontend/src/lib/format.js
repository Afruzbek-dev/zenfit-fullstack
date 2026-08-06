/**
 * Uzbek date helpers. Intl does not ship a reliable `uz-UZ` locale in every
 * WebView (Telegram's Android client included), where it falls back to output
 * like "M08 6, Thu" — so the names are spelled out here instead.
 */

const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

const WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];

export const WEEKDAYS_SHORT = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

/** e.g. "6-avgust, payshanba" */
export function uzFullDate(date = new Date()) {
  return `${date.getDate()}-${MONTHS[date.getMonth()]}, ${WEEKDAYS[date.getDay()]}`;
}

/** e.g. "6-avgust" */
export function uzShortDate(date = new Date()) {
  return `${date.getDate()}-${MONTHS[date.getMonth()]}`;
}

/** Thousands separator that matches local convention (space). */
export function uzNumber(n) {
  return String(Math.round(n ?? 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
