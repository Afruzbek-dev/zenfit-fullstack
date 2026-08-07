/**
 * Safe wrapper around the Telegram WebApp SDK. Every call degrades to a no-op
 * in a plain browser, so `npm run dev` works without Telegram.
 */

const tg = () => (typeof window !== "undefined" ? window.Telegram?.WebApp : undefined);

export const isTelegram = () => Boolean(tg()?.initData);

export function initTelegram() {
  const w = tg();
  if (!w) return;
  try {
    w.ready();
    w.expand();
    // Header/background colours are owned by lib/theme.js so they follow the
    // user's light/dark choice instead of being pinned to the dark palette.
    w.disableVerticalSwipes?.();
  } catch {
    /* older clients lack some of these */
  }
}

export const getInitData = () => tg()?.initData || "";
export const getTelegramUser = () => tg()?.initDataUnsafe?.user || null;

export function haptic(type = "light") {
  const h = tg()?.HapticFeedback;
  if (!h) return;
  try {
    if (type === "success" || type === "warning" || type === "error") h.notificationOccurred(type);
    else if (type === "select") h.selectionChanged();
    else h.impactOccurred(type);
  } catch {
    /* not supported */
  }
}

/**
 * Telegram's native back button. Returns a cleanup function so screens can
 * register and unregister as they mount.
 */
export function setBackButton(handler) {
  const b = tg()?.BackButton;
  if (!b) return () => {};
  try {
    if (handler) {
      b.onClick(handler);
      b.show();
      return () => {
        b.offClick(handler);
        b.hide();
      };
    }
    b.hide();
  } catch {
    /* not supported */
  }
  return () => {};
}

export function openLink(url) {
  const w = tg();
  if (w?.openLink) w.openLink(url, { try_instant_view: false });
  else window.open(url, "_blank", "noopener,noreferrer");
}

export function showConfirm(message) {
  const w = tg();
  return new Promise((resolve) => {
    if (w?.showConfirm) w.showConfirm(message, resolve);
    else resolve(window.confirm(message));
  });
}

export const colorScheme = () => tg()?.colorScheme || "dark";
