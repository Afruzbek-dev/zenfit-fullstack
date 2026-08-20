import { useEffect, useState } from "react";
import { Trophy, Copy, Check, Send, Flame, User2, Gift } from "lucide-react";
import { Screen, ScreenHeader, Section, Button, ErrorNote, Skeleton } from "../components/ui.jsx";
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

/** Real admin-authored challenges, falling back to the "coming soon" teaser when there are none. */
function ActiveChallenges() {
  const { t } = useApp();
  const [challenges, setChallenges] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getChallenges()
      .then((res) => !cancelled && setChallenges(res.challenges))
      .catch((e) => !cancelled && setError(e.message || t("common.error")));
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (error) return <ErrorNote onRetry={() => setError(null)}>{error}</ErrorNote>;
  if (!challenges) return <Skeleton className="h-24 rounded-2xl" />;

  if (challenges.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl2 border border-dashed border-border bg-surface/50 px-6 py-8 text-center">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surfaceAlt">
          <Trophy size={22} className="text-faint" />
        </span>
        <p className="font-display text-[14px] font-bold text-ink">{t("challengesScreen.comingTitle")}</p>
        <p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-muted">{t("challengesScreen.comingDesc")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {challenges.map((c) => {
        const daysLeft = c.endsAt ? Math.max(0, Math.ceil((new Date(c.endsAt) - new Date()) / 86_400_000)) : null;
        return (
          <div key={c.id} className="card flex items-start gap-3 px-4 py-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/12">
              <Trophy size={19} className="text-neon" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-ink">{c.title}</p>
              {c.description && <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{c.description}</p>}
              <p className="mt-1.5 text-[11px] font-semibold text-cyan">
                {daysLeft == null ? t("challengesScreen.openEnded") : t("challengesScreen.endsIn", { days: daysLeft })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ChallengesScreen({ onBack }) {
  const { t } = useApp();
  return (
    <Screen>
      <ScreenHeader title={t("challengesScreen.title")} subtitle={t("challengesScreen.subtitle")} onBack={onBack} />

      <Section>
        <ReferralCard />
      </Section>

      <Section title={t("challengesScreen.leaderboard")}>
        <FriendsLeaderboard />
      </Section>

      <Section>
        <ActiveChallenges />
      </Section>
    </Screen>
  );
}
