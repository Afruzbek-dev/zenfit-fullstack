import { ShieldAlert, Info } from "lucide-react";

/**
 * Explains what the calorie engine decided and why.
 *
 * The engine never refuses a goal outright — it downgrades an unsafe "lose" to
 * "maintain" and hands back the reasons (see backend lib/calorie.js). Without
 * this component that downgrade is invisible: the user picks "lose", gets a
 * maintenance number, and has no way to tell whether the app is protecting them
 * or is simply broken.
 *
 * Two tones, because they are two different statements:
 *   reasons    — "we did not do what you asked, here is why". Amber, prominent.
 *   advisories — "we did what you asked, but read this". Quiet, informational.
 */

/**
 * Server strings are Uzbek. The client owns the translations, keyed by the
 * stable `code`, and interpolates the figures the server measured (`vars`) so a
 * BMI or a kcal allowance is never duplicated into three dictionaries.
 *
 * `t()` returns the path itself when a key is missing, which is the fallback
 * signal: an unrecognised code falls back to the server's own sentence rather
 * than rendering "safety.reasons.some_new_code" at the user.
 */
function localize(t, item, kind) {
  const key = `safety.${kind}.${item.code}`;
  const text = t(key, item.vars);
  return text === key ? item.message : text;
}

export default function SafetyNotice({ safety, t, className = "" }) {
  if (!safety) return null;

  const reasons = safety.reasons || [];
  const advisories = safety.advisories || [];
  if (!reasons.length && !advisories.length) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {reasons.length > 0 && (
        <div className="animate-fade-up rounded-2xl border border-amber/30 bg-amber/[0.08] px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert size={17} className="mt-0.5 shrink-0 text-amber" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-amber">{t("safety.adjustedTitle")}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber/85">
                {t("safety.adjustedDesc", { goal: t(`profile.goals.${safety.goal}`) })}
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {reasons.map((r) => (
                  <p key={r.code} className="text-[12px] leading-relaxed text-ink">
                    {localize(t, r, "reasons")}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {advisories.map((a) => (
        <div key={a.code} className="flex items-start gap-2.5 rounded-2xl border border-borderSoft bg-surface px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-muted" />
          <p className="text-[11.5px] leading-relaxed text-muted">{localize(t, a, "advisories")}</p>
        </div>
      ))}
    </div>
  );
}
