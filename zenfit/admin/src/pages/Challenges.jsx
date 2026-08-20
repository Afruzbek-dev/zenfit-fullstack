import { useCallback, useEffect, useState } from "react";
import { Trophy, Plus, Search, Check, Trash2 } from "lucide-react";
import { api } from "../api.js";
import { Card, Badge, Spinner, EmptyState, Modal, ErrorNote, fmtDate } from "../components/ui.jsx";

const AUDIENCES = [
  { id: "all", label: "Barcha foydalanuvchilar" },
  { id: "premium", label: "Faqat Premium" },
  { id: "free", label: "Faqat Bepul" },
  { id: "selected", label: "Tanlangan foydalanuvchilar" },
];

const AUDIENCE_BADGE = { all: "neon", premium: "amber", free: "muted", selected: "cyan" };

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
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function reset() {
    setTitle("");
    setDescription("");
    setDurationDays("");
    setAudience("all");
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

export default function Challenges() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

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
          Foydalanuvchilarga yuboriladigan e'lonlar — avtomatik progress kuzatilmaydi.
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
                <th className="px-4 py-3 font-bold">Qabul qiluvchilar</th>
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
                  <td className="tabular px-4 py-3 text-muted">
                    {c.audience === "selected" ? c.recipientCount || 0 : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{c.endsAt ? fmtDate(c.endsAt) : "Muddatsiz"}</td>
                  <td className="px-4 py-3 text-[12px] text-muted">{fmtDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(c.id)}
                      aria-label="O'chirish"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-surfaceAlt"
                    >
                      <Trash2 size={14} className="text-rose" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <CreateChallengeModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={load} />
    </div>
  );
}
