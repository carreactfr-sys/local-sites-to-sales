import { signIn, signInWithGoogle, signOut, getSession, rest } from "./auth.js";
import { APP_URL } from "./config.js";
const $ = (id) => document.getElementById(id);
const show = (id) => ["loading", "login", "app"].forEach((s) => ($(s).hidden = s !== id));

async function boot() {
  show("loading");
  const s = await getSession();
  s ? enterApp(s) : enterLogin();
}
function enterLogin() { $("who").textContent = ""; show("login"); $("email").focus(); }

async function enterApp(s) {
  $("who").textContent = s.user.email;
  show("app");
  prefill();
  loadList();
}

async function prefill() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  let info = { name: (tab.title || "").split(/ [-–|·] /)[0], website: /^https?:/.test(tab.url) ? new URL(tab.url).origin : "" };
  if (tab.url && tab.url.includes("google.com/maps")) {
    try {
      const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
        const t = (sel) => document.querySelector(sel)?.textContent?.trim() || "";
        const aria = (p) => [...document.querySelectorAll("[data-item-id]")].find((e) => e.dataset.itemId.startsWith(p));
        const txt = (e) => (e?.getAttribute("aria-label") || "").replace(/^[^:]+:\s*/, "").trim();
        const site = document.querySelector('a[data-item-id="authority"]')?.href || "";
        return { name: t("h1"), category: t('button[jsaction*="category"]'), address: txt(aria("address")), phone: txt(aria("phone")), website: site };
      } });
      info = res.result || info;
    } catch {}
  }
  $("pName").value = info.name || ""; $("pSite").value = info.website || "";
  $("pPhone").value = info.phone || ""; $("pAddr").value = info.address || ""; $("pCat").value = info.category || "";
}

async function loadList() {
  try {
    const rows = await rest("prospects?select=id,name,status&order=created_at.desc&limit=5");
    $("list").innerHTML = rows.length ? "" : '<li class="small muted">Aucun prospect pour l’instant.</li>';
    rows.forEach((r) => { const li = document.createElement("li");
      li.innerHTML = '<span class="n"></span><span class="tag"></span>';
      li.children[0].textContent = r.name; li.children[1].textContent = r.status; $("list").appendChild(li); });
  } catch (e) { handle(e); }
}

function handle(e) { if (e.message === "SESSION_EXPIRED") enterLogin(); else $("addMsg").textContent = e.message; }

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); $("loginErr").textContent = ""; $("loginBtn").disabled = true;
  try { const s = await signIn($("email").value.trim(), $("password").value); $("password").value = ""; enterApp(s); }
  catch (err) { $("loginErr").textContent = err.message === "Invalid login credentials" ? "E-mail ou mot de passe incorrect." : err.message; }
  finally { $("loginBtn").disabled = false; }
});

$("googleBtn").addEventListener("click", async () => {
  $("loginErr").textContent = ""; $("googleBtn").disabled = true;
  try { enterApp(await signInWithGoogle()); }
  catch (err) { $("loginErr").textContent = /cancel|annul|closed/i.test(err.message) ? "Connexion annulée." : err.message; }
  finally { $("googleBtn").disabled = false; }
});

$("addForm").addEventListener("submit", async (e) => {
  e.preventDefault(); $("addBtn").disabled = true; $("addMsg").className = "small"; $("addMsg").textContent = "";
  try {
    const s = await getSession(); if (!s) throw new Error("SESSION_EXPIRED");
    const v = (id) => $(id).value.trim() || null;
    await rest("prospects", { method: "POST", body: JSON.stringify({ user_id: s.user.id, name: v("pName"), website: v("pSite"), phone: v("pPhone"), address: v("pAddr"), category: v("pCat") }) });
    $("addMsg").className = "small ok"; $("addMsg").textContent = "Prospect ajouté ✓"; loadList();
  } catch (err) { handle(err); } finally { $("addBtn").disabled = false; }
});

$("logout").addEventListener("click", async () => { await signOut(); enterLogin(); });
$("openApp").addEventListener("click", (e) => { e.preventDefault(); chrome.tabs.create({ url: APP_URL + "/prospects" }); });
$("signupLink").addEventListener("click", (e) => { e.preventDefault(); chrome.tabs.create({ url: APP_URL + "/auth" }); });
boot();
