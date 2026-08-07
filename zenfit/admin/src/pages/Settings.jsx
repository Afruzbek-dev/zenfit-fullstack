import { useEffect, useState } from "react";
import { Save, CreditCard, Send, Info } from "lucide-react";
import { api } from "../api.js";
import { Card, Section, Spinner, ErrorNote } from "../components/ui.jsx";

const FIELDS = [
  {
    key: "payment_card_number",
    label: "Karta raqami",
    placeholder: "8600 1234 5678 9012",
    hint: "Foydalanuvchilar shu kartaga pul o'tkazadi. Ilovada ko'rinadi.",
  },
  { key: "payment_card_holder", label: "Karta egasi", placeholder: "ISM FAMILIYA" },
  { key: "payment_card_bank", label: "Bank / turi", placeholder: "Uzcard, Humo…" },
  {
    key: "admin_chat_id",
    label: "Admin Telegram chat ID",
    placeholder: "123456789",
    hint: "Chek rasmlari shu chatga keladi. @userinfobot orqali ID'ingizni bilib oling.",
  },
];

export default function Settings() {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .settings()
      .then((r) => alive && setForm({ ...r.settings }))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.saveSettings(form);
      setForm({ ...res.settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!form) {
    return (
      <div className="flex justify-center py-20">
        {error ? <ErrorNote>{error}</ErrorNote> : <Spinner />}
      </div>
    );
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-2xl">
      <Section title="To'lov kartasi">
        <Card className="px-5 py-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-cyan/25 bg-cyan/[0.07] px-4 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-cyan" />
            <p className="text-[12px] leading-relaxed text-muted">
              To'lov provayderi ulanmaguncha foydalanuvchilar shu kartaga o'tkazma qiladi va chek rasmini yuboradi.
              Siz uni "To'lovlar" bo'limida tasdiqlaysiz.
            </p>
          </div>

          {FIELDS.map((f) => (
            <div key={f.key} className="mb-4">
              <label className="label" htmlFor={f.key}>
                {f.label}
              </label>
              <input
                id={f.key}
                value={form[f.key] || ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="input"
              />
              {f.hint && <p className="mt-1.5 text-[11.5px] text-faint">{f.hint}</p>}
            </div>
          ))}

          <div className="mb-4">
            <label className="label" htmlFor="payment_instructions">
              Qo'shimcha ko'rsatma
            </label>
            <textarea
              id="payment_instructions"
              value={form.payment_instructions || ""}
              onChange={(e) => set("payment_instructions", e.target.value)}
              rows={3}
              placeholder="Masalan: To'lovdan keyin chek rasmini yuboring, 1 soat ichida tasdiqlanadi."
              className="input resize-none"
            />
          </div>

          {error && (
            <div className="mb-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button disabled={busy} onClick={save} className="btn-primary">
              {busy ? <Spinner className="text-neonOn" /> : <Save size={16} />}
              Saqlash
            </button>
            {saved && <span className="text-[12.5px] font-semibold text-neon">Saqlandi ✓</span>}
          </div>
        </Card>
      </Section>

      <Section title="Ko'rinishi">
        <Card className="px-5 py-5">
          <p className="mb-3 text-[12px] text-faint">Foydalanuvchi ilovada shuni ko'radi:</p>
          <div className="rounded-xl2 border border-borderSoft bg-surfaceAlt p-5">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-neon" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-faint">
                {form.payment_card_bank || "Karta"}
              </span>
            </div>
            <p className="tabular text-[22px] font-bold tracking-wider text-ink">
              {form.payment_card_number || "•••• •••• •••• ••••"}
            </p>
            <p className="mt-1 text-[13px] font-semibold uppercase text-muted">
              {form.payment_card_holder || "KARTA EGASI"}
            </p>
            {form.payment_instructions && (
              <p className="mt-3 border-t border-borderSoft pt-3 text-[12px] leading-relaxed text-muted">
                {form.payment_instructions}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-neon px-4 py-2.5 text-[13px] font-bold text-neonOn">
              <Send size={14} /> Chek yuborish
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
}
