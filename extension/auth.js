import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
const KEY = "scalesaas_session";
const H = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };

async function save(s) {
  const session = { access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600),
    user: { id: s.user.id, email: s.user.email } };
  await chrome.storage.local.set({ [KEY]: session });
  return session;
}
export async function clear() { await chrome.storage.local.remove(KEY); }

export async function signIn(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: H, body: JSON.stringify({ email, password }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.msg || "Identifiants invalides");
  return save(j);
}

async function refresh(rt) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: H, body: JSON.stringify({ refresh_token: rt }) });
  if (!r.ok) return null;
  return save(await r.json());
}

// Returns a valid session or null (expired/revoked → cleared).
export async function getSession() {
  const s = (await chrome.storage.local.get(KEY))[KEY];
  if (!s) return null;
  let cur = s;
  if (s.expires_at - 60 < Date.now() / 1000) {
    cur = await refresh(s.refresh_token);
  } else {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { ...H, Authorization: `Bearer ${s.access_token}` } });
    if (r.status === 401 || r.status === 403) cur = await refresh(s.refresh_token);
    else if (!r.ok) return s; // network issue: keep session
  }
  if (!cur) { await clear(); return null; }
  return cur;
}

export async function signOut() {
  const s = (await chrome.storage.local.get(KEY))[KEY];
  if (s) await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: { ...H, Authorization: `Bearer ${s.access_token}` } }).catch(() => {});
  await clear();
}

export async function rest(path, opts = {}) {
  const s = await getSession();
  if (!s) throw new Error("SESSION_EXPIRED");
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts,
    headers: { ...H, Authorization: `Bearer ${s.access_token}`, Prefer: "return=representation", ...(opts.headers || {}) } });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && j.message) || "Erreur serveur");
  return j;
}
