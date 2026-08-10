import { useCallback, useEffect, useState } from "react";
import { Check, X, Receipt, Image as ImageIcon, Clock } from "lucide-react";
import { api, fetchReceipt } from "../api.js";
import { Card, Badge, Spinner, EmptyState, Modal, ErrorNote, uzNumber, fmtDateTime } from "../components/ui.jsx";

const TABS = [
  { id: "awaiting_review", label: "Tekshiruvda" },
  { id: "paid", label: "Tasdiqlangan" },
  { id: "rejected", label: "Rad etilgan" },
  { id: "", label: "Barchasi" },
];

const STATUS = {
  paid: ["To'landi", "neon"],
  awaiting_review: ["Tekshiruvda", "amber"],
  pending: ["Kutilmoqda", "muted"],
  rejected: ["Rad etildi", "rose"],
};

/** Loads the receipt through the API and releases the object URL on unmount. */
function ReceiptImage({ paymentId }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    let created = null;
    fetchReceipt(paymentId)
      .then((u) => {
        if (!alive) {
          URL.revokeObjectURL(u);
          return;
        }
        created = u;
        setUrl(u);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [paymentId]);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!url) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-borderSoft bg-surfaceAlt">
        <Spinner />
      </div>
    );
  }
  return <img src={url} alt="To'lov cheki" className="max-h-[60vh] w-full rounded-xl border border-borderSoft object-contain" />;
}

function ReviewModal({ payment, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  if (!payment) return null;

  async function act(fn) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onDone();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const decided = payment.status === "paid" || payment.status === "rejected";

  return (
    <Modal open onClose={onClose} title={`Buyurtma #${payment.id}`} wide>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {payment.receipt_file_id ? (
            <ReceiptImage paymentId={payment.id} />
          ) : (
            <EmptyState
              Icon={ImageIcon}
              title="Chek bu yerda yo'q"
              desc="Foydalanuvchi chekni to'g'ridan-to'g'ri sizning Telegram chatingizga yuborgan. Tasdiqlashdan oldin o'sha chatdan tekshiring."
            />
          )}
          {payment.receipt_note && (
            <p className="mt-3 rounded-xl border border-borderSoft bg-surfaceAlt px-4 py-3 text-[12.5px] text-muted">
              <span className="font-bold text-ink">Izoh: </span>
              {payment.receipt_note}
            </p>
          )}
        </div>

        <div className="lg:border-l lg:border-borderSoft lg:pl-5">
          <div className="mb-4 rounded-xl border border-borderSoft bg-surfaceAlt px-4 py-3">
            <p className="text-[12px] text-faint">Foydalanuvchi</p>
            <p className="text-[14px] font-bold text-ink">{payment.first_name || "—"}</p>
            {payment.username && <p className="text-[12px] text-muted">@{payment.username}</p>}

            <p className="mt-3 text-[12px] text-faint">Reja</p>
            <p className="text-[14px] font-bold text-ink">{payment.plan_title}</p>

            <p className="mt-3 text-[12px] text-faint">Summa</p>
            <p className="tabular text-[20px] font-bold text-neon">{uzNumber(payment.amount_uzs)} so'm</p>

            <p className="mt-3 text-[12px] text-faint">Yuborilgan</p>
            <p className="text-[13px] text-ink">{fmtDateTime(payment.created_at)}</p>
          </div>

          {error && (
            <div className="mb-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}

          {decided ? (
            <div className="rounded-xl border border-borderSoft bg-surfaceAlt px-4 py-3 text-[12.5px] text-muted">
              Bu buyurtma allaqachon ko'rib chiqilgan.
              {payment.reject_reason && <span className="mt-1 block text-rose">Sabab: {payment.reject_reason}</span>}
            </div>
          ) : rejecting ? (
            <>
              <label className="label" htmlFor="reason">
                Rad etish sababi
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Masalan: chek noaniq, summa mos kelmadi"
                className="input mb-3 resize-none"
              />
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => setRejecting(false)} className="btn-ghost flex-1">
                  Orqaga
                </button>
                <button
                  disabled={busy || !reason.trim()}
                  onClick={() => act(() => api.rejectPayment(payment.id, reason.trim()))}
                  className="btn-danger flex-1"
                >
                  <X size={15} /> Rad etish
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <button disabled={busy} onClick={() => act(() => api.approvePayment(payment.id))} className="btn-primary w-full">
                {busy ? <Spinner className="text-neonOn" /> : <Check size={16} />}
                Tasdiqlash va premium berish
              </button>
              <button disabled={busy} onClick={() => setRejecting(true)} className="btn-danger w-full">
                <X size={15} /> Rad etish
              </button>
              <p className="mt-1 text-[11.5px] leading-relaxed text-faint">
                Tasdiqlansa, obuna darhol faollashadi va foydalanuvchiga Telegram orqali xabar boradi.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function Payments() {
  const [tab, setTab] = useState("awaiting_review");
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async (status) => {
    setRows(null);
    setError(null);
    try {
      const res = await api.payments(status);
      setRows(res.payments);
    } catch (e) {
      setError(e.message);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-2 text-[12.5px] font-bold transition-colors ${
              tab === t.id ? "border-neon bg-neon text-neonOn" : "border-borderSoft bg-surfaceAlt text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-[13px] text-rose">{error}</p>}

      {rows === null ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          Icon={tab === "awaiting_review" ? Clock : Receipt}
          title={tab === "awaiting_review" ? "Tekshiruvda hech narsa yo'q" : "Yozuv topilmadi"}
          desc={tab === "awaiting_review" ? "Yangi chek kelganda shu yerda ko'rinadi." : undefined}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="border-b border-borderSoft text-[11px] uppercase tracking-wider text-faint">
              <tr>
                <th className="px-4 py-3 font-bold">#</th>
                <th className="px-4 py-3 font-bold">Foydalanuvchi</th>
                <th className="px-4 py-3 font-bold">Reja</th>
                <th className="px-4 py-3 text-right font-bold">Summa</th>
                <th className="px-4 py-3 font-bold">Holat</th>
                <th className="px-4 py-3 font-bold">Chek</th>
                <th className="px-4 py-3 text-right font-bold">Sana</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const [label, tone] = STATUS[p.status] || [p.status, "muted"];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setOpen(p)}
                    className="cursor-pointer border-b border-borderSoft/60 transition-colors last:border-0 hover:bg-surfaceAlt/60"
                  >
                    <td className="tabular px-4 py-3 text-faint">{p.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">{p.first_name || "—"}</p>
                      {p.username && <p className="text-[11.5px] text-faint">@{p.username}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted">{p.plan_title}</td>
                    <td className="tabular px-4 py-3 text-right font-bold text-ink">{uzNumber(p.amount_uzs)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={tone}>{label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {p.receipt_file_id ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-cyan">
                          <ImageIcon size={12} /> bor
                        </span>
                      ) : (
                        <span className="text-[12px] text-faint">yo'q</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-muted">{fmtDateTime(p.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <ReviewModal payment={open} onClose={() => setOpen(null)} onDone={() => load(tab)} />
    </div>
  );
}
