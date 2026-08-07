import { useEffect } from "react";
import { setBackButton } from "../telegram.js";

/**
 * Binds Telegram's native back button to a handler for as long as the calling
 * screen is mounted. Nested screens register on mount and restore on unmount,
 * so the button always points one level up.
 */
export function useBackButton(handler) {
  useEffect(() => setBackButton(handler), [handler]);
}
