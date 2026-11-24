import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { profileQuery, prospectsQuery, sitesQuery } from "@/lib/queries";
import { CheckCircle2, Chrome } from "lucide-react";

const EXTENSION_URL = ""; // Lien Chrome Web Store (vide = téléchargement du ZIP)

function installExtension() {
  if (EXTENSION_URL) { window.open(EXTENSION_URL, "_blank", "noopener"); return; }
  fetch("/scalesaas-extension.zip").then((r) => { if (!r.ok) throw new Error("Téléchargement impossible"); return r.blob(); }).then((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "lead-saas-extension.zip"; a.click(); URL.revokeObjectURL(a.href); }).catch((e) => alert(e.message));
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Lead SaaS" }, { name: "description", content: "Vue d'ensemble de ton activité." }, { property: "og:title", content: "Dashboard Lead SaaS" }, { property: "og:description", content: "Suis prospects, clients et revenus." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(profileQuery), context.queryClient.ensureQueryData(prospectsQuery), context.queryClient.ensureQueryData(sitesQuery)]),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { data: prospects } = useSuspenseQuery(prospectsQuery);
  const { data: sites } = useSuspenseQuery(sitesQuery);
  if (!profile?.onboarded) return <Navigate to="/onboarding" />;

  const contacted = prospects.filter((p) => p.status !== "nouveau").length;
  const signed = prospects.filter((p) => p.status === "signé");
  const oneOff = signed.reduce((s, p) => s + p.price, 0);
  const mrr = signed.reduce((s, p) => s + p.monthly_fee, 0);
  const pct = Math.min(100, Math.round((mrr / Math.max(1, profile.monthly_target)) * 100));
  const beginner = profile.experience === "Débutant total";

  const plan = [
    { t: "Sauvegarder 10 prospects", done: prospects.length >= 10, to: "/prospects" },
    { t: "Générer ton premier site", done: sites.length > 0, to: "/sites" },
    { t: "Contacter 5 commerces", done: contacted >= 5, to: "/assistant" },
    { t: "Signer ton premier client", done: signed.length > 0, to: "/prospects" },
  ] as const;

  const stats = [
    { l: "Prospects", v: prospects.length },
    { l: "Contactés", v: contacted },
    { l: "Clients signés", v: signed.length },
    { l: "Ventes", v: `${oneOff} €` },
  ];

  return (
    <AppShell title={`Salut ${profile.display_name ?? ""} 👋`} subtitle={`Prospection à ${profile.city} · objectif ${profile.monthly_target} €/mois`} action={
      <button onClick={installExtension} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold transition-colors hover:border-primary">
        <Chrome className="size-4 text-primary" /> Installer l'extension Chrome
      </button>
    }>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{s.l}</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border-2 border-ink bg-ink p-6 text-ink-foreground lg:col-span-1">
          <p className="text-sm opacity-70">Revenus récurrents</p>
          <p className="mt-1 font-display text-5xl font-extrabold">{mrr} €<span className="text-lg opacity-60">/mois</span></p>
          <div className="mt-6 h-3 rounded-full bg-sidebar-accent"><div className="h-3 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-sm opacity-70">{pct}% de ton objectif</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold">{beginner ? "Ton parcours débutant" : "Ton plan d'action"}</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {plan.map((p) => (
              <li key={p.t} className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <span className="flex items-center gap-3"><CheckCircle2 className={p.done ? "size-5 text-success" : "size-5 text-muted-foreground/40"} /> <span className={p.done ? "line-through opacity-60" : ""}>{p.t}</span></span>
                {!p.done && <Button asChild size="sm" variant="outline"><Link to={p.to}>Go</Link></Button>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Sites générés</h2><Button asChild size="sm" variant="ghost"><Link to="/sites">Tout voir</Link></Button></div>
        {sites.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Aucun site pour l'instant.</p> : (
          <ul className="mt-3 divide-y">{sites.slice(0, 5).map((s) => <li key={s.id} className="py-2 text-sm">{s.title} <span className="text-muted-foreground">· {s.style}</span></li>)}</ul>
        )}
      </div>
    </AppShell>
  );
}
