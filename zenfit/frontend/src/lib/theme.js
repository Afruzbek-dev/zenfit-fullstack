/**
 * Theme switching.
 *
 * The preference is one of dark | light | system; `system` follows Telegram's
 * own colour scheme when the app runs inside Telegram, and the OS setting
 * otherwise. index.html applies the stored choice before first paint, so this
 * module only handles changes made while the app is running.
 */

const KEY = "zenfit_theme";
export const THEMES = ["dark", "light", "system"];

const CHROME = { dark: "#0A0B07", light: "#F5F6F0" };

export function storedTheme() {
  try {
    const v = localStorage.getItem(KEY);
    return THEMES.includes(v) ? v : "dark";
  } catch {
    return "dark";
  }
}

export function resolveTheme(pref) {
  if (pref !== "system") return pref === "light" ? "light" : "dark";
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp?.colorScheme : null;
  if (tg === "light" || tg === "dark") return tg;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(pref) {
  const resolved = resolveTheme(pref);
  document.documentElement.setAttribute("data-theme", resolved);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", CHROME[resolved]);

  // Telegram paints the header and the area behind the app itself; without this
  // the native chrome stays dark around a light app.
  const w = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
  try {
    w?.setHeaderColor?.(CHROME[resolved]);
    w?.setBackgroundColor?.(CHROME[resolved]);
  } catch {
    /* older Telegram clients */
  }

  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* private mode */
  }
  return resolved;
}

/** Re-resolves on OS/Telegram changes while "system" is selected. */
export function watchSystemTheme(getPref) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onChange = () => {
    if (getPref() === "system") applyTheme("system");
  };
  mq.addEventListener?.("change", onChange);
  return () => mq.removeEventListener?.("change", onChange);
}
