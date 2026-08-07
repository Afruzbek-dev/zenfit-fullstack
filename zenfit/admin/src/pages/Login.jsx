import { useState } from "react";
import { ShieldCheck, LogIn } from "lucide-react";
import { api, setToken } from "../api.js";
import { ErrorNote, Spinner } from "../components/ui.jsx";

export default function Login({ onDone }) {
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.login(secret);
      setToken(res.token);
      onDone();
    } catch (err) {
      setError(err.message || "Kirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="card w-full max-w-sm px-6 py-7">
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-neon/12 ring-1 ring-neon/25">
            <ShieldCheck size={24} className="text-neon" />
          </span>
          <h1 className="font-display text-[22px] font-bold text-ink">ZenFit Admin</h1>
          <p className="mt-1 text-[12.5px] text-muted">Boshqaruv paneliga kirish</p>
        </div>

        <label className="label" htmlFor="secret">
          Admin paroli
        </label>
        <input
          id="secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          autoComplete="current-password"
          className="input"
          placeholder="••••••••••••"
        />

        {error && (
          <div className="mt-3">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <button type="submit" disabled={busy || secret.length < 8} className="btn-primary mt-5 w-full">
          {busy ? <Spinner className="text-neonOn" /> : <LogIn size={16} />}
          Kirish
        </button>
      </form>
    </div>
  );
}
