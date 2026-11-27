import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions-legales")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Mentions légales — Lead SaaS" },
      { name: "description", content: "Éditeur, hébergeur et informations légales du site Lead SaaS." },
      { property: "og:title", content: "Mentions légales — Lead SaaS" },
      { property: "og:description", content: "Qui édite et héberge Lead SaaS." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://leadsaas.eu/mentions-legales" },
    ],
    links: [{ rel: "canonical", href: "https://leadsaas.eu/mentions-legales" }],
  }),
  component: LegalNotice,
});

const EDITOR = {
  name: "Lead SaaS",
  status: "Particulier",
  address: "[Adresse postale]",
  email: "albkzk527@gmail.com",
};

function LegalNotice() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <Link to="/" className="font-display text-2xl font-extrabold">Lead{" "}<span className="text-primary">SaaS</span></Link>
      <h1 className="mt-10 text-4xl font-extrabold">Mentions légales</h1>
      <div className="mt-8 space-y-6 leading-relaxed [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold">
        <h2>Éditeur du site</h2>
        <p>
          Le site leadsaas.eu est édité par {EDITOR.name}.<br />
          Statut : {EDITOR.status}<br />
          Adresse : {EDITOR.address}<br />
          E-mail : <a className="underline" href={`mailto:${EDITOR.email}`}>{EDITOR.email}</a>
        </p>
        <p>Directeur de la publication : {EDITOR.name}.</p>
        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par Lovable Labs Incorporated, One Lincoln Street, Suite 2500, Boston, MA 02111, États-Unis —{" "}
          <a className="underline" href="https://lovable.dev">lovable.dev</a>.
        </p>
        <h2>Propriété intellectuelle</h2>
        <p>Les textes, le logo, le nom Lead SaaS et l'interface du site appartiennent à l'éditeur. Toute reproduction sans autorisation écrite est interdite. Les sites générés par l'IA pour tes prospects t'appartiennent une fois créés avec ton compte.</p>
        <h2>Responsabilité</h2>
        <p>Les informations sur les commerces viennent de Google Maps et peuvent être incomplètes ou inexactes. Les textes et sites produits par l'IA sont des propositions : vérifie-les avant de les envoyer à un client.</p>
        <h2>Données personnelles et cookies</h2>
        <p>
          La façon dont nous traitons tes données est expliquée dans la{" "}
          <Link to="/confidentialite" className="underline">politique de confidentialité</Link>.
        </p>
        <h2>Droit applicable</h2>
        <p>Les présentes mentions sont soumises au droit français.</p>
      </div>
    </div>
  );
}
