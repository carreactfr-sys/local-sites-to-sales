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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Lead SaaS",
          url: "https://leadsaasai.lovable.app/",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: "fr",
          description: "Outil pour trouver des commerces locaux sans site web, générer leur site avec l'IA et vendre des prestations web.",
          offers: plans.map((p) => ({ "@type": "Offer", name: p.name, price: String(p.price), priceCurrency: "EUR" })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Lead SaaS", url: "https://leadsaasai.lovable.app/" }),
      },
    ],
  }),
  component: Landing,
});

const plans = [
  { name: "Starter", price: 5, d: "10 prospects et 1 site généré par l'IA." },
  { name: "Pro", price: 29, d: "50 prospects, 20 sites et l'assistant commercial IA." },
  { name: "Agence", price: 79, d: "Prospects, sites et assistant sans limite." },
];

const audiences = [
  { t: "Freelances web", d: "Trouve des clients près de chez toi au lieu d'attendre les demandes." },
  { t: "Agences locales", d: "Remplis ton carnet de commandes avec des commerces qui n'ont pas encore de site." },
  { t: "Débutants", d: "Lance une activité de création de sites sans savoir coder." },
];

const faq = [
  { q: "Comment Lead SaaS trouve-t-il des clients ?", a: "Tu choisis une ville et un métier : Lead SaaS repère sur la carte les commerces locaux qui n'ont pas de site web. Ce sont tes prospects." },
  { q: "Faut-il savoir coder pour créer les sites ?", a: "Non. L'IA génère un site vitrine adapté au métier du commerce en un clic. Tu peux le montrer au commerçant avant même de le rencontrer." },
  { q: "Comment vendre le site au commerçant ?", a: "L'assistant commercial rédige ton message de prospection et un plan d'action. Tu peux l'envoyer directement depuis Gmail." },
  { q: "Combien coûte Lead SaaS ?", a: "Trois formules mensuelles sans engagement : Starter à 5 €, Pro à 29 € et Agence à 79 €. Tu peux résilier quand tu veux." },
  { q: "Existe-t-il une extension Chrome ?", a: "Oui. Elle récupère le nom, le téléphone, l'adresse et la catégorie d'un commerce depuis Google Maps ou son site, puis l'ajoute à tes prospects." },
];

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
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-4xl font-extrabold">Pour qui est Lead SaaS ?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {audiences.map((a) => (
            <div key={a.t} className="rounded-xl border-2 border-ink bg-card p-6">
              <h3 className="text-xl font-bold">{a.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-4xl font-extrabold">Les formules</h2>
        <p className="mt-2 text-muted-foreground">Abonnement mensuel, sans engagement.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className="rounded-xl border-2 border-ink bg-card p-6 shadow-pop">
              <h3 className="text-2xl font-bold">{p.name}</h3>
              <p className="mt-2 font-display text-4xl font-extrabold">{p.price} €<span className="text-base font-normal text-muted-foreground">/mois</span></p>
              <p className="mt-3 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
        <Button asChild variant="hero" size="lg" className="mt-8 h-12 text-base">
          <Link to="/auth">Créer mon compte <ArrowRight /></Link>
        </Button>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-4xl font-extrabold">Questions fréquentes</h2>
        <div className="mt-8 space-y-6">
          {faq.map((f) => (
            <div key={f.q}>
              <h3 className="text-lg font-bold">{f.q}</h3>
              <p className="mt-1 text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="flex flex-wrap justify-center gap-4 border-t py-8 text-center text-sm text-muted-foreground"><span>© Lead SaaS</span><Link to="/mentions-legales" className="underline">Mentions légales</Link><Link to="/confidentialite" className="underline">Confidentialité</Link><button type="button" onClick={openCookieSettings} className="underline">Paramètres des cookies</button></footer>
    </div>
  );
}
