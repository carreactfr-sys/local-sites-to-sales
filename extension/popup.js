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

// Runs inside the visited page: reads business info from structured data, meta tags and page text.
function scrapePage() {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const meta = (n) => document.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.content || "";
  const out = { name: "", phone: "", address: "", category: "", website: location.origin };
  // Google Maps place panel
  if (location.hostname.includes("google.") && location.pathname.startsWith("/maps")) {
    const item = (p) => [...document.querySelectorAll("[data-item-id]")].find((e) => e.dataset.itemId.startsWith(p));
    const lab = (e) => clean((e?.getAttribute("aria-label") || "").replace(/^[^:]+:\s*/, ""));
    out.name = clean(document.querySelector("h1")?.textContent);
    out.category = clean(document.querySelector('button[jsaction*="category"]')?.textContent);
    out.address = lab(item("address")); out.phone = lab(item("phone"));
    out.website = document.querySelector('a[data-item-id="authority"]')?.href || "";
    return out;
  }
  // 1. schema.org JSON-LD (LocalBusiness, Restaurant, Store...)
  const nodes = [];
  const walk = (x) => { if (!x || typeof x !== "object") return; if (Array.isArray(x)) return x.forEach(walk); nodes.push(x); if (x["@graph"]) walk(x["@graph"]); };
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => { try { walk(JSON.parse(s.textContent)); } catch {} });
  const skip = /^(WebSite|WebPage|BreadcrumbList|ImageObject|SearchAction|ListItem|Person|Offer|Product|Article|BlogPosting|FAQPage|Question|Answer|SiteNavigationElement|ReadAction)$/;
  const biz = nodes.find((n) => n.address || n.telephone) || nodes.find((n) => n["@type"] && ![].concat(n["@type"]).every((t) => skip.test(t)));
  if (biz) {
    out.name = clean(biz.name);
    out.phone = clean(biz.telephone);
    const t = [].concat(biz["@type"] || []).find((x) => !/^(Organization|LocalBusiness|Place|Thing)$/.test(x));
    out.category = clean(biz.servesCuisine ? `${t || "Restaurant"} · ${[].concat(biz.servesCuisine).join(", ")}` : t ? t.replace(/([a-z])([A-Z])/g, "$1 $2") : "");
    const a = [].concat(biz.address || [])[0];
    out.address = typeof a === "string" ? clean(a) : a ? clean([a.streetAddress, a.postalCode, a.addressLocality].filter(Boolean).join(", ")) : "";
  }
  // 2. Name from meta tags / title
  if (!out.name) out.name = clean(meta("og:site_name")) || clean((document.title || "").split(/\s[-–|·:]\s/)[0]);
  // 3. Phone from tel: links or page text (FR formats)
  if (!out.phone) {
    const tel = document.querySelector('a[href^="tel:"]');
    if (tel) out.phone = clean(decodeURIComponent(tel.getAttribute("href").slice(4)));
    else { const m = document.body.innerText.match(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/); if (m) out.phone = m[0]; }
  }
  // 4. Address from <address> or a French postal pattern
  if (!out.address) {
    const ad = document.querySelector("address");
    if (ad) out.address = clean(ad.innerText).slice(0, 160);
    else { const m = document.body.innerText.match(/\d{1,4}(?:\s?(?:bis|ter))?,?\s+(?:rue|avenue|av\.|boulevard|bd|place|chemin|route|allée|impasse|quai|cours)[^\n,]{2,60},?\s+\d{5}\s+[A-ZÀ-Ÿa-zà-ÿ' -]{2,40}/i); if (m) out.address = clean(m[0]); }
  }
  // 5. Category guess from keywords
  if (!out.category) {
    const txt = (document.title + " " + meta("description") + " " + meta("keywords")).toLowerCase();
    const cats = [["restaurant", "Restaurant"], ["pizz", "Pizzeria"], ["boulang", "Boulangerie"], ["pâtisser", "Pâtisserie"], ["coiff", "Coiffeur"], ["barb", "Barbier"], ["bar ", "Bar"], ["café", "Café"], ["hôtel", "Hôtel"], ["garage", "Garage"], ["plomb", "Plombier"], ["électric", "Électricien"], ["fleur", "Fleuriste"], ["boucher", "Boucherie"], ["pharmac", "Pharmacie"], ["dentist", "Dentiste"], ["avocat", "Avocat"], ["immobili", "Agence immobilière"], ["esthéti", "Institut de beauté"], ["onglerie", "Onglerie"], ["fitness", "Salle de sport"], ["sport", "Salle de sport"], ["boutique", "Boutique"]];
    out.category = (cats.find(([k]) => txt.includes(k)) || [, ""])[1];
  }
  return out;
}

async function prefill() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/^https?:/.test(tab.url || "")) { $("addMsg").textContent = "Ouvre le site d'un commerce pour récupérer ses informations."; return; }
  let info = { name: (tab.title || "").split(/ [-–|·] /)[0], website: new URL(tab.url).origin };
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scrapePage });
    if (res && res.result) info = res.result;
  } catch {}
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
