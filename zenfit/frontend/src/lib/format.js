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

/**
 * Today's date in the device's own timezone, as YYYY-MM-DD.
 *
 * `toISOString().slice(0,10)` gives the UTC date, which is the previous day
 * for the first five hours of every Tashkent morning — long enough to make the
 * app look like it never rolled over.
 */
export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Milliseconds until the next local midnight, for scheduling a rollover. */
export function msUntilLocalMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
