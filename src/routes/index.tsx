import { openCookieSettings } from "@/components/CookieBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Sparkles, MessageSquareText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Lead SaaS — Lance ton agence web IA sans coder" },
      { name: "description", content: "Trouve des commerces sans site, génère leur site avec l'IA et vends tes prestations. Tout le workflow en un seul outil." },
      { property: "og:title", content: "Lead SaaS — Ton agence web IA" },
      { property: "og:description", content: "De la recherche de commerces à la signature du client, sans écrire une ligne de code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://leadsaasai.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://leadsaasai.lovable.app/" }],
  }),
  component: Landing,
});

const steps = [
  { icon: MapPin, t: "Trouve", d: "Repère sur la carte les commerces sans site web dans ta ville." },
  { icon: Sparkles, t: "Crée", d: "Génère un site vitrine pro en un clic, adapté au métier." },
  { icon: MessageSquareText, t: "Vends", d: "L'IA rédige ton message de prospection et ton plan d'action." },
  { icon: TrendingUp, t: "Encaisse", d: "Suis tes clients signés, ventes et abonnements mensuels." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <span className="font-display text-2xl font-extrabold">Lead{" "}<span className="text-primary">SaaS</span></span>
        <Button asChild variant="ink"><Link to="/auth">Se connecter</Link></Button>
      </header>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-paper opacity-60" />
        <div className="absolute inset-0 bg-glow" />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-28">
          <p className="mb-6 inline-block rounded-full border-2 border-ink bg-accent px-4 py-1 font-mono text-xs uppercase tracking-wider">
            AI Website Agency Builder
          </p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-[0.95] md:text-7xl">
            Transforme une recherche de commerces en <span className="text-primary">activité rentable.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Trouve des clients, crée leurs sites avec l'IA et vends tes prestations — sans écrire une seule ligne de code.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild variant="hero" size="lg" className="h-12 text-base">
              <Link to="/auth">Lancer mon agence <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-20 md:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.t} className="rounded-xl border-2 border-ink bg-card p-6 shadow-pop">
            <div className="mb-4 flex items-center justify-between">
              <s.icon className="size-7 text-primary" />
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
            </div>
            <h3 className="text-2xl font-bold">{s.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </section>
      <footer className="flex flex-wrap justify-center gap-4 border-t py-8 text-center text-sm text-muted-foreground"><span>© Lead SaaS</span><Link to="/confidentialite" className="underline">Confidentialité</Link><button type="button" onClick={openCookieSettings} className="underline">Paramètres des cookies</button></footer>
    </div>
  );
}
