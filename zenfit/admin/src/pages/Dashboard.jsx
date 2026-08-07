import { useEffect, useState } from "react";
import { Receipt, TrendingUp, Clock } from "lucide-react";
import { api } from "../api.js";
import { Card, Section, Stat, Badge, Spinner, EmptyState, BarChart, uzNumber, fmtDateTime } from "../components/ui.jsx";

const GOAL_LABEL = { lose: "Ozish", maintain: "Saqlash", gain: "Massa" };
const LANG_LABEL = { uz: "O'zbek", ru: "Rus", en: "Ingliz" };

function Distribution({ title, rows, labels, keyName }) {
  const total = rows.reduce((s, r) => s + Number(r.count || 0), 0) || 1;
  return (
    <Card className="px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{title}</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {rows.length === 0 && <p className="text-[12px] text-faint">Ma'lumot yo'q</p>}
        {rows.map((r) => {
          const key = r[keyName];
          const pct = Math.round((Number(r.count) / total) * 100);
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="text-ink">{labels?.[key] || key}</span>
                <span className="tabular text-muted">
                  {r.count} · {pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-borderSoft">
                <div className="h-full rounded-full bg-neon" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function Dashboard({ onOpenPayments }) {
  const [finance, setFinance] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api.finance(), api.stats()])
      .then(([f, s]) => {
        if (!alive) return;
        setFinance(f);
        setStats(s);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <p className="text-[13px] text-rose">{error}</p>;
  if (!finance || !stats) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const r = finance.revenue;
  const s = finance.sales;

  return (
    <div>
      {finance.pendingReview > 0 && (
        <button
          onClick={onOpenPayments}
          className="mb-6 flex w-full items-center gap-3 rounded-xl2 border border-amber/30 bg-amber/10 px-5 py-4 text-left transition-transform active:scale-[0.995]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber/15">
            <Clock size={19} className="text-amber" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-amber">
              {finance.pendingReview} ta to'lov tasdiqlashni kutmoqda
            </span>
            <span className="mt-0.5 block text-[12px] text-muted">Cheklarni ko'rib chiqing va tasdiqlang</span>
          </span>
        </button>
      )}

      <Section title="Moliya">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Bu oy daromad"
            value={uzNumber(r.month)}
            unit="so'm"
            delta={r.monthDelta}
            tone="neon"
            hint={`O'tgan oy: ${uzNumber(r.prevMonth)} so'm`}
          />
          <Stat
            label="Bu hafta daromad"
            value={uzNumber(r.week)}
            unit="so'm"
            delta={r.weekDelta}
            hint={`O'tgan hafta: ${uzNumber(r.prevWeek)} so'm`}
          />
          <Stat label="Bugun" value={uzNumber(r.today)} unit="so'm" hint={`Jami: ${uzNumber(r.allTime)} so'm`} />
          <Stat
            label="Faol premium"
            value={finance.activePremium}
            unit="kishi"
            tone="amber"
            hint={`Jami sotuv: ${s.allTime} ta`}
          />
        </div>
      </Section>

      <Section title="Sotuvlar">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Bu oy sotuv" value={s.month} unit="ta" delta={s.monthDelta} hint={`O'tgan oy: ${s.prevMonth} ta`} />
          <Stat label="Bu hafta sotuv" value={s.week} unit="ta" delta={s.weekDelta} hint={`O'tgan hafta: ${s.prevWeek} ta`} />
          <Stat label="Yangi user (hafta)" value={stats.newUsersThisWeek} unit="ta" delta={stats.newUsersWeekDelta} />
          <Stat label="Bugun kirgan" value={stats.activeToday} unit="ta" tone="cyan" hint={`Hafta: ${stats.activeThisWeek} ta`} />
        </div>
      </Section>

      <div className="mb-7 grid gap-3 lg:grid-cols-3">
        <Card className="px-5 py-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Ro'yxatdan o'tish (30 kun)</p>
            <Badge tone="neon">
              <TrendingUp size={11} /> {stats.totalUsers} jami
            </Badge>
          </div>
          {stats.dailySignups.length ? (
            <BarChart data={stats.dailySignups} valueKey="count" labelKey="date" />
          ) : (
            <p className="py-8 text-center text-[12px] text-faint">Hali ma'lumot yo'q</p>
          )}
        </Card>

        <Card className="px-5 py-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Rejalar bo'yicha</p>
          {finance.planBreakdown.length === 0 ? (
            <p className="text-[12px] text-faint">Hali sotuv yo'q</p>
          ) : (
            <div className="flex flex-col gap-3">
              {finance.planBreakdown.map((p) => (
                <div key={p.planId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-ink">{p.title}</p>
                    <p className="text-[11.5px] text-muted">{p.count} ta sotuv</p>
                  </div>
                  <span className="tabular shrink-0 text-[13px] font-bold text-neon">{uzNumber(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Section title="Foydalanuvchilar tahlili">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Jami user" value={stats.totalUsers} unit="ta" tone="ink" />
          <Stat label="Ovqat yozuvi" value={uzNumber(stats.totalMeals)} unit="ta" />
          <Stat label="Mashq yozuvi" value={uzNumber(stats.totalWorkouts)} unit="ta" />
          <Stat label="Faollik yozuvi" value={uzNumber(stats.totalActivities)} unit="ta" />
        </div>
      </Section>

      <div className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Distribution title="Maqsad" rows={stats.goalDistribution} labels={GOAL_LABEL} keyName="goal" />
        <Distribution title="Til" rows={stats.languageDistribution} labels={LANG_LABEL} keyName="language" />
        <Distribution
          title="Daraja"
          rows={stats.fitnessLevelDistribution}
          labels={{ beginner: "Yangi", intermediate: "O'rta", advanced: "Tajribali" }}
          keyName="fitness_level"
        />
      </div>

      <Section title="So'nggi to'lovlar">
        {finance.recentSales.length === 0 ? (
          <EmptyState Icon={Receipt} title="Hali to'lov yo'q" desc="Birinchi premium sotuvdan keyin shu yerda ko'rinadi." />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-borderSoft text-[11px] uppercase tracking-wider text-faint">
                <tr>
                  <th className="px-4 py-3 font-bold">Foydalanuvchi</th>
                  <th className="px-4 py-3 font-bold">Reja</th>
                  <th className="px-4 py-3 font-bold">Usul</th>
                  <th className="px-4 py-3 text-right font-bold">Summa</th>
                  <th className="px-4 py-3 text-right font-bold">Sana</th>
                </tr>
              </thead>
              <tbody>
                {finance.recentSales.map((p) => (
                  <tr key={p.id} className="border-b border-borderSoft/60 last:border-0">
                    <td className="px-4 py-3 font-semibold text-ink">
                      {p.name || "—"}
                      {p.username && <span className="ml-1 text-[11.5px] text-faint">@{p.username}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">{p.planTitle}</td>
                    <td className="px-4 py-3">
                      <Badge tone={p.method === "manual" ? "cyan" : "muted"}>
                        {p.method === "manual" ? "Karta" : "Provayder"}
                      </Badge>
                    </td>
                    <td className="tabular px-4 py-3 text-right font-bold text-neon">{uzNumber(p.amountUzs)}</td>
                    <td className="px-4 py-3 text-right text-[12px] text-muted">{fmtDateTime(p.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Section>
    </div>
  );
}
