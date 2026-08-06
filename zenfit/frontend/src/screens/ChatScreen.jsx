import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, Crown, Loader2, Bot } from "lucide-react";
import { Screen, ScreenHeader, Button, ErrorNote } from "../components/ui.jsx";
import { api } from "../api.js";
import { haptic, showConfirm } from "../telegram.js";
import { useApp } from "../store.jsx";

const SUGGESTIONS = [
  "Bugun nima yeyishim kerak?",
  "Tizzam og'riyapti, qanday mashq qilay?",
  "Oqsil me'yorimni qanday to'ldiraman?",
  "Rejamdagi og'irliklarni qachon oshiray?",
];

function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-up`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
          isUser
            ? "rounded-br-md bg-neon text-neonOn"
            : "rounded-bl-md border border-borderSoft bg-surface text-ink"
        }`}
      >
        {content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export default function ChatScreen({ onNavigate }) {
  const { subscription, showToast } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quotaHit, setQuotaHit] = useState(false);
  const [freeLeft, setFreeLeft] = useState(null);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.chatHistory();
        setMessages(res.messages || []);
        setFreeLeft(res.freeMessagesLeft);
      } catch {
        /* history is best-effort; the chat still works without it */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;

    setInput("");
    setError(null);
    setQuotaHit(false);
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: "user", content }]);
    setBusy(true);
    haptic("light");

    try {
      const res = await api.chat(content);
      setMessages((prev) => [...prev, { id: `tmp-a-${Date.now()}`, role: "assistant", content: res.reply }]);
      setFreeLeft(res.freeMessagesLeft);
      haptic("success");
    } catch (e) {
      // Roll the optimistic message back so the thread matches the server.
      setMessages((prev) => prev.filter((m) => m.content !== content || m.role !== "user"));
      setInput(content);
      if (e.status === 402) setQuotaHit(true);
      else setError(e.message || "AI javob bera olmadi");
      haptic("error");
    } finally {
      setBusy(false);
    }
  }

  async function clearChat() {
    if (!(await showConfirm("Suhbat tarixini o'chirasizmi?"))) return;
    try {
      await api.clearChat();
      setMessages([]);
      showToast("Tarix o'chirildi");
    } catch (e) {
      showToast(e.message || "Xatolik", "error");
    }
  }

  return (
    <div className="relative z-10 mx-auto flex h-screen w-full max-w-lg flex-col px-5">
      <ScreenHeader
        title="AI Trener"
        subtitle="Rejangiz va statistikangizni ko'rib turadi"
        right={
          <div className="flex shrink-0 items-center gap-2">
            {freeLeft !== null && !subscription?.isPremium && (
              <span className="rounded-full border border-borderSoft bg-surfaceAlt px-2.5 py-1.5 text-[11px] font-semibold text-muted">
                {freeLeft}
              </span>
            )}
            {messages.length > 0 && (
              <button onClick={clearChat} aria-label="Tarixni tozalash" className="grid h-9 w-9 place-items-center rounded-full bg-surfaceAlt">
                <Trash2 size={15} className="text-muted" />
              </button>
            )}
          </div>
        }
      />

      <div className="-mx-5 flex-1 space-y-2.5 overflow-y-auto px-5 pb-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin text-faint" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center pt-6 text-center">
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-neon/12 ring-1 ring-neon/25">
              <Bot size={28} className="text-neon" />
            </span>
            <h2 className="font-display text-[18px] font-bold text-ink">Shaxsiy AI treneringiz</h2>
            <p className="mt-1.5 max-w-[290px] text-[12.5px] leading-relaxed text-muted">
              Ovqatlanish, mashq va tiklanish bo'yicha savol bering. U sizning profilingiz, bugungi kaloriyangiz va mashq tarixingizni ko'rib turadi.
            </p>
            <div className="mt-6 flex w-full flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="flex items-center gap-2.5 rounded-2xl border border-borderSoft bg-surface px-4 py-3 text-left active:scale-[0.99]"
                >
                  <Sparkles size={14} className="shrink-0 text-neon" />
                  <span className="text-[12.5px] text-ink">{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m.id} role={m.role} content={m.content} />)
        )}

        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-borderSoft bg-surface px-3.5 py-3">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}

        {quotaHit && (
          <div className="card card-lit flex flex-col items-center px-5 py-6 text-center">
            <Crown size={22} className="mb-2 text-amber" />
            <p className="font-display text-[15px] font-bold text-ink">Bepul xabarlar tugadi</p>
            <p className="mt-1 text-[12px] text-muted">Cheksiz suhbat uchun Premium'ni faollashtiring.</p>
            <Button className="mt-3" size="sm" onClick={() => onNavigate("profile")}>
              <Crown size={14} /> Premium
            </Button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div
        className="-mx-5 border-t border-borderSoft bg-bg/90 px-5 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: "calc(var(--nav-h) + var(--safe-bottom) + 12px)" }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-2xl border border-borderSoft bg-surface px-3.5 py-2.5 focus-within:border-neon/50">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Savolingizni yozing…"
              className="max-h-24 w-full resize-none bg-transparent text-[14px] leading-relaxed text-ink outline-none placeholder:text-faint"
            />
          </div>
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            aria-label="Yuborish"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neon text-neonOn active:scale-95 disabled:opacity-35"
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}
