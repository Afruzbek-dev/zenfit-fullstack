import { useCallback, useEffect, useState } from "react";
import { Search, Crown, User2, Users as UsersIcon } from "lucide-react";
import { api } from "../api.js";
import { Card, Badge, Spinner, EmptyState, fmtDate } from "../components/ui.jsx";
import UserCard from "./UserCard.jsx";

const GOAL_LABEL = { lose: "Ozish", maintain: "Saqlash", gain: "Massa" };
const PAGE = 25;

function isPremium(u) {
  return u.sub_status === "active" && (!u.expires_at || new Date(u.expires_at) > new Date());
}

export default function Users() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async (q, off) => {
    setError(null);
    try {
      const res = await api.users({ search: q, limit: PAGE, offset: off });
      setRows(res.users);
      setTotal(res.total);
    } catch (e) {
      setError(e.message);
      setRows([]);
    }
  }, []);

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => load(search, offset), search ? 300 : 0);
    return () => clearTimeout(id);
  }, [search, offset, load]);

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-borderSoft bg-surfaceAlt px-3.5 py-2.5 focus-within:border-neon/50">
          <Search size={16} className="shrink-0 text-faint" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="Ism, username yoki Telegram ID bo'yicha qidirish…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </div>
        <span className="tabular shrink-0 text-[12.5px] text-muted">{total} ta</span>
      </div>

      {error && <p className="mb-4 text-[13px] text-rose">{error}</p>}

      {rows === null ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState Icon={UsersIcon} title="Foydalanuvchi topilmadi" desc="Qidiruv so'zini o'zgartirib ko'ring." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead className="border-b border-borderSoft text-[11px] uppercase tracking-wider text-faint">
              <tr>
                <th className="px-4 py-3 font-bold">Foydalanuvchi</th>
                <th className="px-4 py-3 font-bold">Maqsad</th>
                <th className="px-4 py-3 font-bold">Yosh / Bo'y / Vazn</th>
                <th className="px-4 py-3 font-bold">Me'yor</th>
                <th className="px-4 py-3 font-bold">Obuna</th>
                <th className="px-4 py-3 font-bold">Qo'shilgan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setOpenId(u.id)}
                  className="cursor-pointer border-b border-borderSoft/60 transition-colors last:border-0 hover:bg-surfaceAlt/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-surfaceAlt">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User2 size={15} className="text-faint" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{u.first_name || "—"}</p>
                        <p className="truncate text-[11.5px] text-faint">
                          {u.username ? `@${u.username}` : `ID ${u.telegram_id}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{GOAL_LABEL[u.goal] || "—"}</td>
                  <td className="tabular px-4 py-3 text-muted">
                    {u.age || "—"} / {u.height_cm || "—"} / {u.weight_kg || "—"}
                  </td>
                  <td className="tabular px-4 py-3 text-muted">{u.daily_calorie_target || "—"}</td>
                  <td className="px-4 py-3">
                    {isPremium(u) ? (
                      <Badge tone="amber">
                        <Crown size={10} /> Premium
                      </Badge>
                    ) : !u.onboarding_completed ? (
                      <Badge tone="rose">Tugatmagan</Badge>
                    ) : (
                      <Badge>Bepul</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted">{fmtDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {total > PAGE && (
        <div className="mt-4 flex items-center justify-between">
          <button disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - PAGE))} className="btn-ghost">
            Oldingi
          </button>
          <span className="tabular text-[12.5px] text-muted">
            {offset + 1}–{Math.min(offset + PAGE, total)} / {total}
          </span>
          <button disabled={offset + PAGE >= total} onClick={() => setOffset((o) => o + PAGE)} className="btn-ghost">
            Keyingi
          </button>
        </div>
      )}

      <UserCard
        userId={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => load(search, offset)}
      />
    </div>
  );
}
