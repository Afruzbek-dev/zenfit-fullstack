import { useEffect } from "react";
import { X, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

export function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Section({ title, action, children, className = "" }) {
  return (
    <section className={`mb-7 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-faint">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Number formatted the way the local business reads it: 1 234 567. */
export const uzNumber = (n) => new Intl.NumberFormat("en-US").format(Math.round(Number(n) || 0)).replace(/,/g, " ");

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Percent change against the previous period.
 * `null` means there was no baseline — showing "+100%" against zero would
 * overstate what actually happened.
 */
export function Delta({ value, invert = false }) {
  if (value === null || value === undefined) {
    return <span className="text-[11.5px] font-semibold text-faint">yangi</span>;
  }
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-faint">
        <Minus size={11} /> 0%
      </span>
    );
  }
  const good = invert ? value < 0 : value > 0;
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold ${good ? "text-neon" : "text-rose"}`}>
      <Icon size={11} />
      {value > 0 ? "+" : ""}
      {value}%
    </span>
  );
}

export function Stat({ label, value, unit, delta, hint, tone = "ink" }) {
  const tones = { ink: "text-ink", neon: "text-neon", cyan: "text-cyan", amber: "text-amber", rose: "text-rose" };
  return (
    <Card className="px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={`tabular text-[26px] font-bold leading-none ${tones[tone]}`}>{value}</span>
        {unit && <span className="text-[12px] font-semibold text-faint">{unit}</span>}
        {delta !== undefined && <Delta value={delta} />}
      </div>
      {hint && <p className="mt-1.5 text-[11.5px] text-muted">{hint}</p>}
    </Card>
  );
}

export function Badge({ children, tone = "muted" }) {
  const tones = {
    muted: "border-borderSoft bg-surfaceAlt text-muted",
    neon: "border-neon/30 bg-neon/12 text-neon",
    amber: "border-amber/30 bg-amber/12 text-amber",
    rose: "border-rose/30 bg-rose/12 text-rose",
    cyan: "border-cyan/30 bg-cyan/12 text-cyan",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Spinner({ className = "" }) {
  return <Loader2 size={18} className={`animate-spin text-faint ${className}`} />;
}

export function EmptyState({ Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center rounded-xl2 border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-surfaceAlt">
          <Icon size={22} className="text-faint" />
        </span>
      )}
      <p className="font-display text-[15px] font-bold text-ink">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted">{desc}</p>}
    </div>
  );
}

export function ErrorNote({ children }) {
  return (
    <div className="rounded-xl border border-rose/25 bg-rose/10 px-4 py-3 text-[12.5px] leading-relaxed text-rose">
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`animate-fade-up w-full ${wide ? "max-w-4xl" : "max-w-lg"} rounded-xl2 border border-border bg-surface`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-xl2 border-b border-borderSoft bg-surface/95 px-5 py-4 backdrop-blur">
          <h3 className="truncate font-display text-[17px] font-bold text-ink">{title}</h3>
          <button onClick={onClose} aria-label="Yopish" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surfaceAlt">
            <X size={15} className="text-muted" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Simple bar chart for the signup/revenue trends — no chart library needed. */
export function BarChart({ data, valueKey = "count", labelKey = "date", color = "#CCFF00", height = 120 }) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        return (
          <div key={i} className="group relative flex-1" title={`${d[labelKey]}: ${v}`}>
            <div
              className="w-full rounded-t transition-all"
              style={{ height: `${Math.max(2, (v / max) * height)}px`, backgroundColor: color, opacity: v ? 1 : 0.25 }}
            />
          </div>
        );
      })}
    </div>
  );
}
