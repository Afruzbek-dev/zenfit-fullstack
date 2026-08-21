import { useEffect, useState } from "react";
import { Trophy, Copy, Check, Send, Flame, User2, Gift, Plus, Crown, BarChart3, Trash2 } from "lucide-react";
import { Screen, ScreenHeader, Section, Button, ErrorNote, Skeleton, Sheet } from "../components/ui.jsx";
import PremiumSheet from "./profile/PremiumSheet.jsx";
import { api } from "../api.js";
import { haptic, openTelegramLink } from "../telegram.js";
import { useApp } from "../store.jsx";

/** One row in the friends leaderboard, ranked by streak. */
function FriendRow({ rank, friend, t }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surfaceAlt text-[11.5px] font-bold text-faint">
        {rank}
      </span>
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surfaceAlt">
        {friend.avatarUrl ? (
          <img src={friend.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User2 size={17} className="text-faint" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-ink">
          {friend.firstName || friend.username || "—"}
        </span>
        {friend.isMyReferrer && (
          <span className="block text-[10.5px] text-cyan">{t("challengesScreen.invitedYou")}</span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-bold text-amber">
        <Flame size={13} /> {friend.streak}
      </span>
    </div>
  );
}

function ReferralCard() {
  const { t, showToast } = useApp();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getReferralInfo()
      .then((res) => !cancelled && setInfo(res))
      .catch((e) => !cancelled && setError(e.message || t("common.error")));
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(info.link);
      setCopied(true);
      haptic("success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(info.link, "neutral");
    }
  }

  function shareLink() {
    haptic("light");
    const text = t("challengesScreen.shareText", { discount: 10 });
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(info.link)}&text=${encodeURIComponent(text)}`);
  }

  if (error) return <ErrorNote onRetry={() => setError(null)}>{error}</ErrorNote>;
  if (!info) return <Skeleton className="h-32 rounded-2xl" />;

  return (
    <div className="card px-4 py-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/12">
          <Gift size={19} className="text-neon" />
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-ink">{t("challengesScreen.inviteTitle")}</p>
          <p className="text-[11.5px] leading-relaxed text-muted">
            {t("challengesScreen.inviteDesc", { signupDays: 1, bonusDays: 7, discount: 10 })}
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-surfaceAlt px-2 py-2.5 text-center">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-faint">{t("challengesScreen.invited")}</p>
          <p className="tabular mt-0.5 text-[16px] font-bold text-ink">{info.referredCount}</p>
        </div>
        <div className="rounded-xl bg-surfaceAlt px-2 py-2.5 text-center">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-faint">{t("challengesScreen.daysEarned")}</p>
          <p className="tabular mt-0.5 text-[16px] font-bold text-neon">{info.rewardDaysEarned}</p>
        </div>
      </div>

      {info.link ? (
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-borderSoft bg-surfaceAlt py-3 text-[12.5px] font-bold text-ink active:scale-[0.98]"
          >
            {copied ? <Check size={14} className="text-neon" /> : <Copy size={14} />}
            {copied ? t("premium.copied") : t("challengesScreen.copyLink")}
          </button>
          <Button className="flex-1" onClick={shareLink}>
            <Send size={14} /> {t("challengesScreen.share")}
          </Button>
        </div>
      ) : (
        <p className="text-[11.5px] leading-relaxed text-faint">{t("challengesScreen.linkPending")}</p>
      )}
    </div>
  );
}

function FriendsLeaderboard() {
  const { t } = useApp();
  const [friends, setFriends] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getFriends()
      .then((res) => !cancelled && setFriends(res.friends))
      .catch((e) => !cancelled && setError(e.message || t("common.error")));
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (error) return <ErrorNote onRetry={() => setError(null)}>{error}</ErrorNote>;
  if (!friends) return <Skeleton className="h-16 rounded-2xl" />;
  if (friends.length === 0) {
    return <p className="text-[11.5px] leading-relaxed text-faint">{t("challengesScreen.noFriends")}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {friends.map((f, i) => (
        <FriendRow key={f.id} rank={i + 1} friend={f} t={t} />
      ))}
    </div>
  );
}

const METRICS = ["steps", "workouts", "kcal", "active_days"];

/** Gold / silver / bronze — center spot tallest, left/right shorter. */
const PODIUM = {
  1: { order: "order-2", ring: "border-amber", glow: "bg-amber/15", text: "text-amber", bar: "bg-amber/25", barH: "h-16", avatar: "h-16 w-16" },
  2: { order: "order-1", ring: "border-faint/70", glow: "bg-surfaceAlt", text: "text-ink", bar: "bg-surfaceAlt", barH: "h-11", avatar: "h-12 w-12" },
  3: { order: "order-3", ring: "border-rose/60", glow: "bg-rose/12", text: "text-rose", bar: "bg-rose/15", barH: "h-8", avatar: "h-12 w-12" },
};

function PodiumSpot({ entry, rank, isMe, t }) {
  const p = PODIUM[rank];
  return (
    <div className={`flex flex-1 flex-col items-center ${p.order}`}>
      <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full border-2 ${p.ring} ${p.glow} ${p.avatar}`}>
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User2 size={rank === 1 ? 24 : 18} className="text-faint" />
        )}
      </span>
      <p className={`mt-2 max-w-[76px] truncate text-center text-[12px] font-bold ${isMe ? "text-neon" : "text-ink"}`}>
        {entry.firstName || entry.username || "—"}
      </p>
      <p className={`tabular text-[12px] font-bold ${p.text}`}>{Math.round(entry.value)}</p>
      <div className={`mt-2 flex w-full items-start justify-center rounded-t-xl pt-1.5 ${p.bar} ${p.barH}`}>
        <span className={`text-[15px] font-bold ${p.text}`}>{rank}</span>
      </div>
    </div>
  );
}

/** The ranking for one challenge, behind a single button on its card. */
function LeaderboardSheet({ challenge, onClose }) {
  const { user, t } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!challenge) return undefined;
    let cancelled = false;
    setData(null);
    setError(null);
    api
      .getChallengeLeaderboard(challenge.id)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e.message || t("common.error")));
    return () => {
      cancelled = true;
    };
  }, [challenge, t]);

  const rows = data?.entries || [];
  const podiumRows = rows.slice(0, 3);
  const restRows = rows.slice(3);
  // Being 140th is still worth seeing — a leaderboard that hides you is
  // demoralising, so the caller's own row is appended when it fell off the cap.
  const meOutside = data?.me && !rows.some((r) => String(r.userId) === String(data.me.userId));

  return (
    <Sheet open={Boolean(challenge)} onClose={onClose} title={t("challengesScreen.openLeaderboard")}>
      {error ? (
        <ErrorNote>{error}</ErrorNote>
      ) : !data ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-faint">{t("challengesScreen.noParticipants")}</p>
      ) : (
        <>
          <p className="mb-4 text-center text-[11.5px] font-semibold text-faint">
            {t(`challengesScreen.metrics.${data.metric}`)}
          </p>

          <div className="mb-5 flex items-end gap-2">
            {podiumRows.map((r) => (
              <PodiumSpot key={r.userId} entry={r} rank={r.rank} isMe={String(r.userId) === String(user?.id)} t={t} />
            ))}
          </div>

          {(restRows.length > 0 || meOutside) && (
            <div className="flex flex-col gap-2">
              {[...restRows, ...(meOutside ? [data.me] : [])].map((r) => {
                const isMe = String(r.userId) === String(user?.id);
                return (
                  <div
                    key={r.userId}
                    className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${
                      isMe ? "border-neon/40 bg-neon/[0.06]" : "border-borderSoft bg-surface"
                    }`}
                  >
                    <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surfaceAlt text-[11.5px] font-bold text-faint">
                      {r.rank}
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-surfaceAlt">
                      {r.avatarUrl ? (
                        <img src={r.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User2 size={15} className="text-faint" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
                      {r.firstName || r.username || "—"}
                    </span>
                    <span className="tabular shrink-0 text-[12.5px] font-bold text-neon">{Math.round(r.value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}

/** Premium-only authoring. Metric and target are what make a leaderboard mean anything. */
function CreateChallengeSheet({ open, onClose, onCreated }) {
  const { showToast, t } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("steps");
  const [target, setTarget] = useState("");
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.createChallenge({
        title: title.trim(),
        description: description.trim() || undefined,
        metric,
        goalTarget: target ? Number(target) : undefined,
        durationDays: days ? Number(days) : undefined,
      });
      haptic("success");
      showToast(t("challengesScreen.created"), "success");
      setTitle("");
      setDescription("");
      setTarget("");
      onCreated();
      onClose();
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("challengesScreen.createTitle")}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={140}
        placeholder={t("challengesScreen.titlePlaceholder")}
        className="mb-2.5 w-full rounded-2xl border border-borderSoft bg-surfaceAlt px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-neon/50"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
        rows={2}
        placeholder={t("challengesScreen.descPlaceholder")}
        className="mb-4 w-full resize-none rounded-2xl border border-borderSoft bg-surfaceAlt px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-neon/50"
      />

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("challengesScreen.metricLabel")}</p>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {METRICS.map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`rounded-xl border px-3 py-2.5 text-[12px] font-semibold ${
              metric === m ? "border-neon bg-neon/12 text-neon" : "border-borderSoft bg-surfaceAlt text-muted"
            }`}
          >
            {t(`challengesScreen.metrics.${m}`)}
          </button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("challengesScreen.targetLabel")}</p>
          <input
            type="number"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="70000"
            className="w-full rounded-2xl border border-borderSoft bg-surfaceAlt px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-neon/50"
          />
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("challengesScreen.durationLabel")}</p>
          <input
            type="number"
            inputMode="numeric"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="7"
            className="w-full rounded-2xl border border-borderSoft bg-surfaceAlt px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-neon/50"
          />
        </div>
      </div>

      <Button full size="lg" loading={busy} disabled={!title.trim()} onClick={submit}>
        <Plus size={16} /> {t("challengesScreen.create")}
      </Button>
    </Sheet>
  );
}

/** One challenge: what it measures, how far along this user is, who else is in. */
function ChallengeCard({ challenge: c, onToggle, onLeaderboard, onDelete, busy, t }) {
  const daysLeft = c.endsAt ? Math.max(0, Math.ceil((new Date(c.endsAt) - new Date()) / 86_400_000)) : null;
  const pct = c.goalTarget > 0 ? Math.min(100, Math.round((c.myValue / c.goalTarget) * 100)) : null;

  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/12">
          <Trophy size={19} className="text-neon" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-ink">{c.title}</p>
          {c.description && <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{c.description}</p>}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-faint">
            <span className="font-semibold text-cyan">
              {daysLeft == null ? t("challengesScreen.openEnded") : t("challengesScreen.endsIn", { days: daysLeft })}
            </span>
            <span>· {t(`challengesScreen.metrics.${c.metric}`)}</span>
            <span>· {t("challengesScreen.participants", { n: c.participantCount })}</span>
            <span>· {c.createdByUserId ? c.creatorName || t("challengesScreen.byUser") : t("challengesScreen.byAdmin")}</span>
          </p>
        </div>
        {c.isMine && (
          <button onClick={() => onDelete(c)} aria-label={t("common.delete")} className="shrink-0 text-faint">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Progress is the point of joining, so it sits on the card rather than
          behind the leaderboard button — greyed until they actually sign up. */}
      <div className={`mt-3 ${c.joined ? "" : "opacity-45"}`}>
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-muted">{t("challengesScreen.myProgress")}</span>
          <span className="tabular font-bold text-ink">
            {Math.round(c.myValue)}
            {c.goalTarget > 0 && <span className="text-faint"> / {Math.round(c.goalTarget)}</span>}
          </span>
        </div>
        {pct != null && (
          <div className="h-1.5 overflow-hidden rounded-full bg-borderSoft">
            <div className="h-full rounded-full bg-neon transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          className="flex-1"
          variant={c.joined ? "ghost" : "primary"}
          loading={busy === c.id}
          onClick={() => onToggle(c)}
        >
          {c.joined ? <><Check size={14} /> {t("challengesScreen.leave")}</> : t("challengesScreen.join")}
        </Button>
        <Button className="flex-1" variant="ghost" onClick={() => onLeaderboard(c)}>
          <BarChart3 size={14} /> {t("challengesScreen.openLeaderboard")}
        </Button>
      </div>
    </div>
  );
}

function ActiveChallenges({ onOpenPremium }) {
  const { subscription, showToast, t } = useApp();
  const [challenges, setChallenges] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [board, setBoard] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api
      .getChallenges()
      .then((res) => !cancelled && setChallenges(res.challenges))
      .catch((e) => !cancelled && setError(e.message || t("common.error")));
    return () => {
      cancelled = true;
    };
  }, [t, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  async function toggle(c) {
    setBusy(c.id);
    try {
      if (c.joined) await api.leaveChallenge(c.id);
      else await api.joinChallenge(c.id);
      haptic("success");
      reload();
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function remove(c) {
    setBusy(c.id);
    try {
      await api.deleteChallenge(c.id);
      reload();
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setBusy(null);
    }
  }

  function create() {
    if (!subscription?.isPremium) {
      onOpenPremium?.();
      return;
    }
    setCreateOpen(true);
  }

  return (
    <>
      <Button full variant="ghost" className="mb-3" onClick={create}>
        {subscription?.isPremium ? <Plus size={15} /> : <Crown size={15} />} {t("challengesScreen.create")}
      </Button>

      {error ? (
        <ErrorNote onRetry={reload}>{error}</ErrorNote>
      ) : !challenges ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : challenges.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl2 border border-dashed border-border bg-surface/50 px-6 py-8 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surfaceAlt">
            <Trophy size={22} className="text-faint" />
          </span>
          <p className="font-display text-[14px] font-bold text-ink">{t("challengesScreen.comingTitle")}</p>
          <p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-muted">{t("challengesScreen.comingDesc")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {challenges.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              busy={busy}
              t={t}
              onToggle={toggle}
              onLeaderboard={setBoard}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      <LeaderboardSheet challenge={board} onClose={() => setBoard(null)} />
      <CreateChallengeSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
    </>
  );
}

export default function ChallengesScreen({ onBack }) {
  const { t } = useApp();
  const [premiumOpen, setPremiumOpen] = useState(false);

  return (
    <Screen>
      <ScreenHeader title={t("challengesScreen.title")} subtitle={t("challengesScreen.subtitle")} onBack={onBack} />

      <Section title={t("challengesScreen.activeTitle")}>
        <ActiveChallenges onOpenPremium={() => setPremiumOpen(true)} />
      </Section>

      <Section>
        <ReferralCard />
      </Section>

      <Section title={t("challengesScreen.leaderboard")}>
        <FriendsLeaderboard />
      </Section>

      <PremiumSheet open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </Screen>
  );
}
