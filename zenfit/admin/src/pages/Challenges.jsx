import { useCallback, useEffect, useState } from "react";
import { Trophy, Plus, Search, Check, Trash2, BarChart3 } from "lucide-react";
import { api } from "../api.js";
import { Card, Badge, Spinner, EmptyState, Modal, ErrorNote, fmtDate } from "../components/ui.jsx";

const AUDIENCES = [
  { id: "all", label: "Barcha foydalanuvchilar" },
  { id: "premium", label: "Faqat Premium" },
  { id: "free", label: "Faqat Bepul" },
  { id: "selected", label: "Tanlangan foydalanuvchilar" },
];

const AUDIENCE_BADGE = { all: "neon", premium: "amber", free: "muted", selected: "cyan" };

/** Must match backend/src/lib/challengeStats.js — every one is derived from existing logs. */
const METRICS = [
  { id: "steps", label: "Qadamlar" },
  { id: "workouts", label: "Mashqlar soni" },
  { id: "kcal", label: "Sarflangan kkal" },
  { id: "active_days", label: "Faol kunlar" },
];
const METRIC_LABEL = Object.fromEntries(METRICS.map((m) => [m.id, m.label]));

function isPremium(u) {
  return u.sub_status === "active" && (!u.expires_at || new Date(u.expires_at) > new Date());
}

/** Compact, debounced user search + multi-pick — only shown for audience 'selected'. */
function RecipientPicker({ selected, onChange }) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    const id = setTimeout(() => {
      api
        .users({ search, limit: 20 })
        .then((res) => alive && setRows(res.users))
        .catch(() => alive && setRows([]))
        .finally(() => alive && setBusy(false));
    }, search ? 300 : 0);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [search]);

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-borderSoft bg-surfaceAlt px-3 py-2.5">
        <Search size={15} className="shrink-0 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism, username yoki ID bo'yicha qidirish…"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
        />
      </div>
      <p className="mb-2 text-[11.5px] text-muted">{selected.size} ta tanlandi</p>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-borderSoft">
        {busy ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-[12px] text-faint">Topilmadi</p>
        ) : (
          rows.map((u) => {
            const on = selected.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u.id)}
                className={`flex w-full items-center gap-2.5 border-b border-borderSoft/60 px-3 py-2.5 text-left last:border-0 ${
                  on ? "bg-neon/[0.08]" : ""
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                    on ? "border-neon bg-neon" : "border-borderSoft"
                  }`}
                >
                  {on && <Check size={12} className="text-neonOn" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">{u.first_name || "—"}</span>
                  <span className="block text-[11px] text-faint">
                    {u.username ? `@${u.username}` : `ID ${u.telegram_id}`} {isPremium(u) ? "· Premium" : ""}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function CreateChallengeModal({ open, onClose, onDone }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [audience, setAudience] = useState("all");
  const [metric, setMetric] = useState("active_days");
  const [goalTarget, setGoalTarget] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function reset() {
    setTitle("");
    setDescription("");
    setDurationDays("");
    setAudience("all");
    setMetric("active_days");
    setGoalTarget("");
    setSelected(new Set());
    setError(null);
    setResult(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.createChallenge({
        title: title.trim(),
        description: description.trim() || undefined,
        audience,
        metric,
        goalTarget: goalTarget ? Number(goalTarget) : undefined,
        durationDays: durationDays ? Number(durationDays) : undefined,
        userIds: audience === "selected" ? [...selected] : undefined,
      });
      setResult(res);
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function close() {
    reset();
    onClose();
  }

  const valid = title.trim().length > 0 && (audience !== "selected" || selected.size > 0);

  return (
    <Modal open={open} onClose={close} title="Yangi challenge">
      {result ? (
        <div>
          <p className="mb-4 text-[13px] leading-relaxed text-ink">
            Challenge yaratildi va {result.recipients} ta foydalanuvchiga yuborildi
            {result.stopped ? " (vaqt tugagani uchun to'liq yakunlanmadi)" : ""} — {result.sent} tasiga
            muvaffaqiyatli yetkazildi.
          </p>
          <button onClick={close} className="btn-primary w-full">
            Yopish
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Sarlavha</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              className="input"
              placeholder="Masalan: 7 kunlik qadam challenge'i"
            />
          </div>
          <div>
            <label className="label">Tavsif (ixtiyoriy)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              className="input resize-none"
              placeholder="Qisqa tavsif…"
            />
          </div>
          <div>
            <label className="label">Davomiyligi, kun (ixtiyoriy — bo'sh qoldirilsa muddatsiz)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="input"
              placeholder="masalan 7"
            />
          </div>
          <div>
            <label className="label">Reyting nima bo'yicha o'lchansin</label>
            <div className="grid grid-cols-2 gap-2">
              {METRICS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetric(m.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-semibold transition-colors ${
                    metric === m.id ? "border-neon bg-neon/[0.12] text-ink" : "border-borderSoft bg-surfaceAlt text-muted"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Maqsad (ixtiyoriy — bo'sh qoldirilsa faqat reyting)</label>
            <input
              type="number"
              min={1}
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              className="input"
              placeholder="masalan 70000"
            />
          </div>
          <div>
            <label className="label">Auditoriya</label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAudience(a.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-semibold transition-colors ${
                    audience === a.id ? "border-neon bg-neon/[0.12] text-ink" : "border-borderSoft bg-surfaceAlt text-muted"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {audience === "selected" && <RecipientPicker selected={selected} onChange={setSelected} />}

          {error && <ErrorNote>{error}</ErrorNote>}

          <button disabled={!valid || busy} onClick={submit} className="btn-primary w-full">
            {busy ? <Spinner className="text-neonOn" /> : <Plus size={16} />} Yaratish va yuborish
          </button>
        </div>
      )}
    </Modal>
  );
}

/** The same ranking users see, so a "why am I 4th?" question is answerable. */
function LeaderboardModal({ challenge, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!challenge) return undefined;
    let alive = true;
    setData(null);
    setError(null);
    api
      .challengeLeaderboard(challenge.id)
      .then((res) => alive && setData(res))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [challenge]);

  return (
    <Modal open={Boolean(challenge)} onClose={onClose} title={challenge ? `Reyting — ${challenge.title}` : ""}>
      {error ? (
        <ErrorNote>{error}</ErrorNote>
      ) : !data ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : data.entries.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] text-faint">Hali hech kim qo'shilmagan.</p>
      ) : (
        <>
          <p className="mb-3 text-[12px] text-muted">
            {METRIC_LABEL[data.metric] || data.metric}
            {data.goalTarget ? ` · maqsad ${data.goalTarget}` : ""}
          </p>
          <div className="flex flex-col gap-1.5">
            {data.entries.map((e) => (
              <div
                key={e.userId}
                className="flex items-center gap-3 rounded-xl border border-borderSoft bg-surfaceAlt px-3 py-2.5"
              >
                <span className="tabular w-6 shrink-0 text-[12px] font-bold text-faint">{e.rank}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">{e.firstName || "—"}</span>
                  {e.username && <span className="block text-[11px] text-faint">@{e.username}</span>}
                </span>
                <span className="tabular shrink-0 text-[13px] font-bold text-neon">{Math.round(e.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

export default function Challenges() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [board, setBoard] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.challenges();
      setRows(res.challenges);
    } catch (e) {
      setError(e.message);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id) {
    if (!window.confirm("Bu challenge'ni o'chirasizmi? Bu qaytarib bo'lmaydi.")) return;
    try {
      await api.deleteChallenge(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted">
          Foydalanuvchilar qo'shiladi, progress va reyting tanlangan metrika bo'yicha avtomatik hisoblanadi.
          Premium foydalanuvchilar ham o'z challenge'ini yarata oladi — ular bu yerda "Muallif" ustunida ko'rinadi.
        </p>
        <button onClick={() => setCreateOpen(true)} className="btn-primary shrink-0">
          <Plus size={16} /> Yangi challenge
        </button>
      </div>

      {error && <p className="mb-4 text-[13px] text-rose">{error}</p>}

      {rows === null ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState Icon={Trophy} title="Hali challenge yo'q" desc="Yangi challenge yaratib, foydalanuvchilarga yuboring." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-borderSoft text-[11px] uppercase tracking-wider text-faint">
              <tr>
                <th className="px-4 py-3 font-bold">Sarlavha</th>
                <th className="px-4 py-3 font-bold">Auditoriya</th>
                <th className="px-4 py-3 font-bold">Metrika</th>
                <th className="px-4 py-3 font-bold">Qatnashchi</th>
                <th className="px-4 py-3 font-bold">Muallif</th>
                <th className="px-4 py-3 font-bold">Tugaydi</th>
                <th className="px-4 py-3 font-bold">Yaratildi</th>
                <th className="px-4 py-3 text-right font-bold" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-borderSoft/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink">{c.title}</p>
                    {c.description && (
                      <p className="max-w-[320px] truncate text-[11.5px] text-faint">{c.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={AUDIENCE_BADGE[c.audience] || "muted"}>
                      {AUDIENCES.find((a) => a.id === c.audience)?.label || c.audience}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted">{METRIC_LABEL[c.metric] || c.metric}</td>
                  <td className="tabular px-4 py-3 text-muted">
                    {c.participantCount || 0}
                    {c.goalTarget ? <span className="text-faint"> · {c.goalTarget}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted">{c.creatorName || "Admin"}</td>
                  <td className="px-4 py-3 text-muted">{c.endsAt ? fmtDate(c.endsAt) : "Muddatsiz"}</td>
                  <td className="px-4 py-3 text-[12px] text-muted">{fmtDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setBoard(c)}
                        aria-label="Reyting"
                        className="grid h-8 w-8 place-items-center rounded-lg bg-surfaceAlt"
                      >
                        <BarChart3 size={14} className="text-muted" />
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        aria-label="O'chirish"
                        className="grid h-8 w-8 place-items-center rounded-lg bg-surfaceAlt"
                      >
                        <Trash2 size={14} className="text-rose" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <CreateChallengeModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={load} />
      <LeaderboardModal challenge={board} onClose={() => setBoard(null)} />
    </div>
  );
}
