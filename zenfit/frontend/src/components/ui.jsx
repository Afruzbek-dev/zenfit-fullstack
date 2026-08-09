import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { haptic } from "../telegram.js";
// store.jsx does not import this module, so reaching for the context here is
// safe — no cycle — and it keeps every screen's back button on one label.
import { useApp } from "../store.jsx";

/** Round 36px header control. Both header slots use this so they stay aligned. */
export function IconButton({ Icon, label, onClick, tone = "muted", active }) {
  const tones = { muted: "text-muted", neon: "text-neon", amber: "text-amber", rose: "text-rose" };
  return (
    <button
      onClick={() => {
        haptic("light");
        onClick?.();
      }}
      aria-label={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full active:scale-95 ${
        active ? "bg-neon/15" : "bg-surfaceAlt"
      }`}
    >
      <Icon size={17} className={tones[tone]} />
    </button>
  );
}

/** Header back affordance for screens that are not in the tab bar. */
export function BackButton({ onBack }) {
  const { t } = useApp();
  if (!onBack) return null;
  return <IconButton Icon={ChevronLeft} label={t("common.back")} onClick={onBack} />;
}

/* ------------------------------- layout ------------------------------- */

/**
 * `topPad` is for screens that render no ScreenHeader. The header used to be
 * the only thing supplying the top safe-area inset, so without it content
 * would slide under the status bar and Telegram's own chrome.
 */
export function Screen({ children, className = "", topPad = false }) {
  return (
    <div
      className={`relative z-10 mx-auto w-full max-w-lg px-5 ${className}`}
      style={{
        paddingTop: topPad ? "calc(var(--safe-top) + 12px)" : undefined,
        paddingBottom: "calc(var(--nav-h) + var(--safe-bottom) + 24px)",
      }}
    >
      {children}
    </div>
  );
}

/** Right-aligned controls for a screen that has no header bar to hang them on. */
export function ScreenActions({ children }) {
  return <div className="mb-3 flex min-h-9 items-center justify-end gap-1.5">{children}</div>;
}

/**
 * App bar: title centred, optional icon in each corner.
 *
 * The side slots are absolutely positioned so the title stays optically centred
 * no matter how wide the actions are, and the title area is padded past them so
 * a long title truncates rather than sliding underneath.
 */
export function ScreenHeader({ title, subtitle, onBack, action, sticky = true }) {
  return (
    <header
      className={`${sticky ? "sticky top-0 z-20" : ""} -mx-5 mb-4 border-b border-borderSoft/60 bg-bg/85 px-5 pb-3 backdrop-blur-xl`}
      style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}
    >
      <div className="relative flex min-h-9 items-center justify-center">
        {onBack && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <BackButton onBack={onBack} />
          </div>
        )}

        <div className="min-w-0 px-12 text-center">
          <h1 className="truncate font-display text-[17px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-[11.5px] leading-snug text-muted">{subtitle}</p>}
        </div>

        {action && <div className="absolute right-0 top-1/2 -translate-y-1/2">{action}</div>}
      </div>
    </header>
  );
}

export function Section({ title, action, children, className = "" }) {
  return (
    <section className={`mb-6 ${className}`}>
      {(title || action) && (
        <div className="mb-2.5 flex items-center justify-between">
          {title && <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ------------------------------ controls ------------------------------ */

// `disabled` must be pulled out of the props: it is spread onto the element
// last, so leaving it in `rest` re-applied disabled={false} over the loading
// guard and every call site passing both stayed clickable while its request was
// in flight — a double tap logged the meal or workout twice.
export function Button({ children, variant = "primary", size = "md", full, loading, disabled, className = "", onClick, ...rest }) {
  const sizes = { sm: "px-3.5 py-2 text-[13px]", md: "px-5 py-3.5 text-[15px]", lg: "px-6 py-4 text-base" };
  const variants = {
    primary: "btn-primary",
    ghost: "btn-ghost",
    danger: "rounded-2xl border border-rose/30 bg-rose/10 font-semibold text-rose active:scale-[0.97]",
  };
  return (
    <button
      onClick={(e) => {
        haptic("light");
        onClick?.(e);
      }}
      disabled={loading || disabled}
      className={`${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""} inline-flex items-center justify-center gap-2 ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={() => {
        haptic("select");
        onClick?.();
      }}
      className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-xs font-semibold transition-colors ${
        active ? "border-neon bg-neon text-neonOn" : "border-borderSoft bg-surfaceAlt text-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function OptionCard({ active, Icon, title, desc, onClick, badge }) {
  return (
    <button
      onClick={() => {
        haptic("select");
        onClick?.();
      }}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-[0.985] ${
        active ? "border-neon bg-neon/[0.13]" : "border-borderSoft bg-surface"
      }`}
    >
      {Icon && (
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-neon/20" : "bg-surfaceAlt"}`}>
          <Icon size={19} className={active ? "text-neon" : "text-muted"} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block truncate text-sm font-bold text-ink">{title}</span>
          {badge}
        </span>
        {desc && <span className="mt-0.5 block text-xs text-muted">{desc}</span>}
      </span>
      {active && <span className="h-2 w-2 shrink-0 rounded-full bg-neon" />}
    </button>
  );
}

/**
 * On/off switch.
 *
 * The knob needs an explicit `left`: an absolutely positioned child with
 * `left: auto` falls back to its static position, and a button centres its
 * content, which parked the knob in the middle of the track instead of at
 * either end. Knob colours are chosen to stay legible on both the lime "on"
 * track and the muted "off" track, in both themes.
 */
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        haptic("select");
        onChange(!checked);
      }}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-neon" : "bg-borderSoft"
      }`}
    >
      <span
        className={`absolute left-1 top-1 h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5 bg-neonOn" : "translate-x-0 bg-muted"
        }`}
      />
    </button>
  );
}

export function ListRow({ Icon, emoji, title, subtitle, right, onClick, danger }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={
        onClick
          ? () => {
              haptic("light");
              onClick();
            }
          : undefined
      }
      className="flex w-full items-center gap-3 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3 text-left active:scale-[0.99]"
    >
      {(Icon || emoji) && (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surfaceAlt text-xl">
          {emoji || <Icon size={18} className={danger ? "text-rose" : "text-muted"} />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[13.5px] font-bold ${danger ? "text-rose" : "text-ink"}`}>{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[11.5px] text-muted">{subtitle}</span>}
      </span>
      {right ?? (onClick && <ChevronRight size={16} className="shrink-0 text-faint" />)}
    </Tag>
  );
}

/* ------------------------------- overlay ------------------------------ */

export function Sheet({ open, onClose, title, children, maxHeight = "88vh" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portalled to <body>: screens render inside a `z-10` wrapper, so a nested
  // z-50 would still lose to the root-level bottom nav.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm"
      style={{ background: "var(--scrim)" }}
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-up w-full max-w-lg overflow-y-auto rounded-t-xl3 border-t border-border bg-surface"
        style={{ maxHeight, paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
      >
        <div className="sticky top-0 z-10 bg-surface/95 px-5 pb-2 pt-3 backdrop-blur">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-borderSoft" />
          {title && (
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
              <button onClick={onClose} aria-label="Yopish" className="grid h-8 w-8 place-items-center rounded-full bg-surfaceAlt">
                <X size={16} className="text-muted" />
              </button>
            </div>
          )}
        </div>
        <div className="px-5 pt-2">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------ feedback ------------------------------ */

export function EmptyState({ Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl2 border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
      {Icon && (
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-surfaceAlt">
          <Icon size={24} className="text-faint" />
        </span>
      )}
      <p className="font-display text-[15px] font-bold text-ink">{title}</p>
      {desc && <p className="mt-1 max-w-[280px] text-[12.5px] leading-relaxed text-muted">{desc}</p>}
      {action && <div className="mt-4 w-full max-w-[240px]">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-xl2 ${className}`} />;
}

export function ErrorNote({ children, onRetry }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-rose/25 bg-rose/10 px-4 py-3">
      <p className="flex-1 text-[12.5px] leading-relaxed text-rose">{children}</p>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 text-[12px] font-bold text-rose underline">
          Qayta
        </button>
      )}
    </div>
  );
}

/** Transient bottom toast. */
export function Toast({ message, tone = "neutral" }) {
  if (!message) return null;
  const tones = {
    neutral: "bg-surfaceHi text-ink border-border",
    success: "bg-neon text-neonOn border-neon",
    error: "bg-rose text-white border-rose",
  };
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-5"
      style={{ bottom: "calc(var(--nav-h) + var(--safe-bottom) + 16px)" }}
    >
      <div className={`animate-fade-up rounded-2xl border px-4 py-2.5 text-[13px] font-semibold shadow-2xl ${tones[tone]}`}>
        {message}
      </div>
    </div>
  );
}

/* -------------------------------- data -------------------------------- */

/** Circular progress used for the calorie hero. */
export function ProgressRing({ value, max, size = 168, stroke = 12, children }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const over = value > max;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Themed via inline style: SVG presentation attributes do not accept var(). */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: "rgb(var(--c-borderSoft))" }} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - pct * c}
          style={{
            stroke: over ? "rgb(var(--c-rose))" : "rgb(var(--c-neon))",
            transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function MacroBar({ label, value, target, color }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  // Stacked rather than label-left/value-right: three of these sit side by side
  // on a 360px screen, where a single row collides.
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.1em] text-faint">{label}</p>
      <p className="tabular mb-1.5 mt-0.5 truncate text-[11.5px] font-semibold text-muted">
        {Math.round(value)}<span className="text-faint">/{target || 0}g</span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-borderSoft">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function StatTile({ Icon, label, value, unit, tone = "neon" }) {
  const tones = { neon: "text-neon", cyan: "text-cyan", amber: "text-amber", rose: "text-rose" };
  return (
    <div className="card card-lit flex-1 px-3.5 py-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={13} className={tones[tone]} />}
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{label}</span>
      </div>
      <p className="tabular text-[19px] font-bold leading-none text-ink">
        {value}
        {unit && <span className="ml-0.5 text-[11px] font-semibold text-faint">{unit}</span>}
      </p>
    </div>
  );
}
