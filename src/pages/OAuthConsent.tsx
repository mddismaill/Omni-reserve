import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";

// Minimal typed shim for the beta supabase.auth.oauth namespace.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export default function OAuthConsent() {
  const params = new URLSearchParams(window.location.search);
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loadDetails = async () => {
    setError(null);
    if (!authorizationId) {
      setError("Missing authorization_id");
      return;
    }
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) {
      setError(error.message);
      return;
    }
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      window.location.href = immediate;
      return;
    }
    setDetails(data);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!active) return;
      if (!sess.session) {
        setNeedsAuth(true);
        return;
      }
      await loadDetails();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorizationId]);

  async function signInAndLoad(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNeedsAuth(false);
    await loadDetails();
  }

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    background: "#0f172a",
    color: "#f1f5f9",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  };
  const card: React.CSSProperties = {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: "1.5rem 1.75rem",
    maxWidth: 460,
    width: "100%",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
  };
  const btn = (primary: boolean): React.CSSProperties => ({
    padding: "0.6rem 1rem",
    borderRadius: 8,
    border: primary ? "1px solid #38bdf8" : "1px solid #475569",
    background: primary ? "#0ea5e9" : "transparent",
    color: primary ? "#0b1220" : "#e2e8f0",
    cursor: busy ? "not-allowed" : "pointer",
    fontWeight: 600,
    opacity: busy ? 0.7 : 1,
  });
  const input: React.CSSProperties = {
    width: "100%",
    padding: "0.55rem 0.75rem",
    borderRadius: 8,
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#f1f5f9",
    marginTop: 4,
  };

  if (error) {
    return (
      <main style={wrap}>
        <div style={card}>
          <h1 style={{ marginTop: 0 }}>Authorization error</h1>
          <p style={{ color: "#fda4af" }}>{error}</p>
          <button style={btn(true)} onClick={() => window.location.reload()}>Try again</button>
        </div>
      </main>
    );
  }

  if (needsAuth) {
    return (
      <main style={wrap}>
        <form style={card} onSubmit={signInAndLoad}>
          <h1 style={{ marginTop: 0 }}>Sign in to continue</h1>
          <p style={{ color: "#94a3b8", marginTop: 0 }}>
            Sign in to approve this app's access to your account.
          </p>
          <label style={{ display: "block", marginTop: 12 }}>
            Email
            <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label style={{ display: "block", marginTop: 12 }}>
            Password
            <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button type="submit" style={btn(true)} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </div>
        </form>
      </main>
    );
  }

  if (!details) {
    return (
      <main style={wrap}>
        <div style={card}>Loading…</div>
      </main>
    );
  }

  const clientName = details.client?.name ?? "an app";
  return (
    <main style={wrap}>
      <div style={card}>
        <h1 style={{ marginTop: 0 }}>Connect {clientName}</h1>
        <p style={{ color: "#cbd5e1" }}>
          {clientName} is requesting access to use Book, Dine &amp; Find as you.
          It will be able to browse published businesses, list your bookings, and cancel bookings you own.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button style={btn(true)} disabled={busy} onClick={() => decide(true)}>Approve</button>
          <button style={btn(false)} disabled={busy} onClick={() => decide(false)}>Deny</button>
        </div>
      </div>
    </main>
  );
}
