/**
 * Date helpers. Intl does not ship a reliable `uz-UZ` locale in every WebView
 * (Telegram's Android client included), where it falls back to output like
 * "M08 6, Thu" — so the names are spelled out here instead. Russian and
 * English are spelled out alongside it rather than mixing two mechanisms.
 */

const MONTHS = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const WEEKDAYS = {
  uz: ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"],
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

/** Chart-axis labels — kept to two characters so seven fit across a phone. */
const WEEKDAYS_SHORT = {
  uz: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
};

const pick = (table, lang) => table[lang] || table.uz;

/** e.g. "6-avgust, payshanba" · "6 августа, четверг" · "Thursday, 6 August" */
export function fullDate(date = new Date(), lang = "uz") {
  const month = pick(MONTHS, lang)[date.getMonth()];
  const weekday = pick(WEEKDAYS, lang)[date.getDay()];
  if (lang === "en") return `${weekday}, ${date.getDate()} ${month}`;
  if (lang === "ru") return `${date.getDate()} ${month}, ${weekday}`;
  return `${date.getDate()}-${month}, ${weekday}`;
}

/** e.g. "6-avgust" · "6 августа" · "6 August" */
export function shortDate(date = new Date(), lang = "uz") {
  const month = pick(MONTHS, lang)[date.getMonth()];
  return lang === "uz" ? `${date.getDate()}-${month}` : `${date.getDate()} ${month}`;
}

/** e.g. "Pa" · "Чт" · "Th" — the weekly chart's axis labels. */
export function weekdayShort(date = new Date(), lang = "uz") {
  return pick(WEEKDAYS_SHORT, lang)[date.getDay()];
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
