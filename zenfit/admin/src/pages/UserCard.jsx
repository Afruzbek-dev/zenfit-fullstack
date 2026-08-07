import { useEffect, useState } from "react";
import { Crown, User2, Utensils, Dumbbell, Activity, MessageSquare, Flame, ShieldOff, Check } from "lucide-react";
import { api } from "../api.js";
import { Modal, Badge, Spinner, ErrorNote, uzNumber, fmtDate, fmtDateTime } from "../components/ui.jsx";

const GOAL = { lose: "Ozish", maintain: "Vaznni saqlash", gain: "Massa yig'ish" };
const LEVEL = { beginner: "Yangi boshlovchi", intermediate: "O'rta daraja", advanced: "Tajribali" };
const ACTIVITY = {
  sedentary: "Harakatsiz", light: "Yengil", moderate: "O'rtacha", active: "Faol", very_active: "Juda faol",
};
const LANG = { uz: "O'zbekcha", ru: "Ruscha", en: "Inglizcha" };
const STATUS = { paid: ["To'landi", "neon"], awaiting_review: ["Tekshiruvda", "amber"], pending: ["Kutilmoqda", "muted"], rejected: ["Rad etildi", "rose"] };

const GRANT_OPTIONS = [
  { days: 7, label: "7 kun" },
  { days: 30, label: "30 kun" },
  { days: 90, label: "90 kun" },
  { days: 365, label: "1 yil" },
];

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-borderSoft/50 py-2 last:border-0">
      <span className="shrink-0 text-[12px] text-faint">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] font-semibold text-ink">{value ?? "—"}</span>
    </div>
  );
}

function MiniStat({ Icon, label, value, tone = "text-ink" }) {
  return (
    <div className="rounded-xl border border-borderSoft bg-surfaceAlt px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={12} className="text-faint" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-faint">{label}</span>
      </div>
      <p className={`tabular text-[17px] font-bold leading-none ${tone}`}>{value}</p>
    </div>
  );
}

export default function UserCard({ userId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!userId) {
      setData(null);
      return undefined;
    }
    let alive = true;
    setData(null);
    setError(null);
    api
      .user(userId)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [userId]);

  async function grant(days) {
    setBusy(true);
    setError(null);
    try {
      await api.grantPremium(userId, { days, note: note.trim() || undefined });
      const fresh = await api.user(userId);
      setData(fresh);
      setNote("");
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setError(null);
    try {
      await api.grantPremium(userId, { revoke: true });
      const fresh = await api.user(userId);
      setData(fresh);
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const u = data?.user;
  const sub = data?.subscription;
  const premium = sub?.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > new Date());

  return (
    <Modal open={Boolean(userId)} onClose={onClose} title={u?.first_name || "Foydalanuvchi"} wide>
      {!data && !error && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}

      {data && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* left: profile + history */}
          <div>
            <div className="mb-5 flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-surfaceAlt ring-1 ring-neon/20">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User2 size={24} className="text-faint" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[19px] font-bold text-ink">{u.display_name || u.first_name || "—"}</p>
                <p className="truncate text-[12.5px] text-muted">
                  {u.username ? `@${u.username}` : `Telegram ID ${u.telegram_id}`}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {premium ? (
                    <Badge tone="amber">
                      <Crown size={10} /> Premium
                    </Badge>
                  ) : (
                    <Badge>Bepul</Badge>
                  )}
                  {!u.onboarding_completed && <Badge tone="rose">Onboarding tugatilmagan</Badge>}
                  <Badge tone="cyan">{LANG[u.language] || "O'zbekcha"}</Badge>
                </div>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <MiniStat Icon={Utensils} label="Ovqat" value={uzNumber(data.stats.totalMeals)} />
              <MiniStat Icon={Dumbbell} label="Mashq" value={uzNumber(data.stats.totalWorkouts)} />
              <MiniStat Icon={Activity} label="Faollik" value={uzNumber(data.stats.totalActivities)} />
              <MiniStat Icon={MessageSquare} label="AI xabar" value={uzNumber(data.stats.totalChatMessages)} />
              <MiniStat Icon={Flame} label="Yeyilgan kkal" value={uzNumber(data.stats.totalCaloriesConsumed)} tone="text-amber" />
              <MiniStat Icon={Flame} label="Sarflangan kkal" value={uzNumber(data.stats.totalCaloriesBurned)} tone="text-cyan" />
            </div>

            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Profil</h4>
            <div className="mb-5 rounded-xl border border-borderSoft bg-surfaceAlt px-4 py-2">
              <Row label="Jins" value={u.gender === "female" ? "Ayol" : u.gender === "male" ? "Erkak" : null} />
              <Row label="Yosh" value={u.age} />
              <Row label="Bo'y" value={u.height_cm && `${u.height_cm} sm`} />
              <Row label="Vazn" value={u.weight_kg && `${u.weight_kg} kg`} />
              <Row label="Maqsad" value={GOAL[u.goal]} />
              <Row label="Daraja" value={LEVEL[u.fitness_level]} />
              <Row label="Faollik" value={ACTIVITY[u.activity_level]} />
              <Row label="Kunlik me'yor" value={u.daily_calorie_target && `${u.daily_calorie_target} kkal`} />
              <Row label="Jihoz" value={u.equipment} />
              <Row label="Jarohat" value={u.injuries} />
              <Row label="Qo'shilgan" value={fmtDate(u.created_at)} />
              <Row label="Oxirgi faollik" value={fmtDateTime(u.last_seen_at)} />
            </div>

            {data.weightHistory.length > 1 && (
              <>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Vazn tarixi</h4>
                <div className="mb-5 rounded-xl border border-borderSoft bg-surfaceAlt px-4 py-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                    {data.weightHistory.map((w, i) => (
                      <span key={i} className="tabular text-muted">
                        {fmtDate(w.recorded_at)}: <span className="font-bold text-ink">{w.weight_kg} kg</span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">To'lovlar</h4>
            {data.payments.length === 0 ? (
              <p className="mb-5 text-[12.5px] text-faint">Hali to'lov yo'q.</p>
            ) : (
              <div className="mb-5 flex flex-col gap-1.5">
                {data.payments.map((p) => {
                  const [label, tone] = STATUS[p.status] || [p.status, "muted"];
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-borderSoft bg-surfaceAlt px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold text-ink">{p.plan_title}</p>
                        <p className="text-[11px] text-faint">{fmtDateTime(p.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="tabular text-[12.5px] font-bold text-ink">{uzNumber(p.amount_uzs)}</span>
                        <Badge tone={tone}>{label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">So'nggi yozuvlar</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-borderSoft bg-surfaceAlt px-3.5 py-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Ovqat</p>
                {data.recentMeals.length === 0 ? (
                  <p className="text-[12px] text-faint">Yo'q</p>
                ) : (
                  data.recentMeals.slice(0, 6).map((m) => (
                    <div key={m.id} className="flex justify-between gap-2 py-1 text-[12px]">
                      <span className="truncate text-ink">{m.emoji} {m.name}</span>
                      <span className="tabular shrink-0 text-amber">{m.kcal}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="rounded-xl border border-borderSoft bg-surfaceAlt px-3.5 py-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Mashq</p>
                {data.recentWorkouts.length === 0 ? (
                  <p className="text-[12px] text-faint">Yo'q</p>
                ) : (
                  data.recentWorkouts.slice(0, 6).map((w) => (
                    <div key={w.id} className="flex justify-between gap-2 py-1 text-[12px]">
                      <span className="truncate text-ink">{w.exercise_name}</span>
                      <span className="tabular shrink-0 text-cyan">{w.sets_completed || 0} set</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* right: premium control */}
          <div className="lg:border-l lg:border-borderSoft lg:pl-5">
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Premium boshqaruvi</h4>

            <div className={`mb-4 rounded-xl border px-4 py-3.5 ${premium ? "border-amber/30 bg-amber/10" : "border-borderSoft bg-surfaceAlt"}`}>
              <div className="flex items-center gap-2">
                <Crown size={16} className={premium ? "text-amber" : "text-faint"} />
                <span className={`text-[13.5px] font-bold ${premium ? "text-amber" : "text-muted"}`}>
                  {premium ? "Premium faol" : "Bepul reja"}
                </span>
              </div>
              {premium && sub?.expires_at && (
                <p className="mt-1.5 text-[12px] text-muted">Amal qiladi: {fmtDate(sub.expires_at)}</p>
              )}
            </div>

            <label className="label" htmlFor="grant-note">
              Izoh (ixtiyoriy)
            </label>
            <input
              id="grant-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Masalan: naqd to'lov"
              className="input mb-3"
            />

            <p className="label">Premium berish</p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {GRANT_OPTIONS.map((o) => (
                <button key={o.days} disabled={busy} onClick={() => grant(o.days)} className="btn-ghost">
                  <Check size={14} /> {o.label}
                </button>
              ))}
            </div>

            <p className="mb-4 text-[11.5px] leading-relaxed text-faint">
              Premium mavjud bo'lsa, kunlar ustiga qo'shiladi. Foydalanuvchiga Telegram orqali xabar boradi.
            </p>

            {premium && (
              <button disabled={busy} onClick={revoke} className="btn-danger w-full">
                <ShieldOff size={15} /> Premiumni bekor qilish
              </button>
            )}

            {busy && (
              <div className="mt-3 flex justify-center">
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
