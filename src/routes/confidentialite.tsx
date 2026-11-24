import { createFileRoute, Link } from "@tanstack/react-router";
import { openCookieSettings } from "@/components/CookieBanner";

export const Route = createFileRoute("/confidentialite")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "Politique de confidentialité — Lead SaaS" }, { name: "description", content: "Comment Lead SaaS collecte et protège tes données." }, { property: "og:title", content: "Confidentialité — Lead SaaS" }, { property: "og:description", content: "Données collectées, usages et tes droits." }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" }, { property: "og:url", content: "https://leadsaasai.lovable.app/confidentialite" }], links: [{ rel: "canonical", href: "https://leadsaasai.lovable.app/confidentialite" }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <Link to="/" className="font-display text-2xl font-extrabold">Lead{" "}<span className="text-primary">SaaS</span></Link>
      <h1 className="mt-10 text-4xl font-extrabold">Politique de confidentialité</h1>
      <div className="mt-8 space-y-6 leading-relaxed [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold">
        <h2>Données de ton compte</h2>
        <p>Quand tu crées un compte, nous gardons ton e-mail, ton nom et les réponses du questionnaire. La connexion peut passer par Google : Google nous transmet alors ton nom et ton e-mail.</p>
        <h2>Données de ton activité</h2>
        <p>Nous gardons les prospects que tu ajoutes (depuis la carte ou l'extension Chrome), les sites générés et ta formule d'abonnement. Seul toi y as accès ; un administrateur peut voir ton e-mail, ton nom et ta formule pour gérer ton abonnement.</p>
        <h2>Services utilisés</h2>
        <p>La recherche de commerces utilise Google Maps. Les textes et les sites sont générés par l'intelligence artificielle via Lovable : les informations du commerce et ta demande lui sont envoyées. Les e-mails sont ouverts dans Gmail ou ton application e-mail ; nous ne les envoyons pas à ta place.</p>
        <h2>Mesure d'audience</h2>
        <p>Lovable mesure l'audience du site. Cette mesure n'utilise aucun cookie, ne stocke rien sur ton appareil, ne garde pas les adresses IP et ne permet pas d'identifier les visiteurs. Lovable collecte ces données pour nous. <a className="underline" href="https://lovable.dev/privacy">La politique de confidentialité de Lovable</a> explique comment il les traite.</p>
        <p>Elle enregistre les pages visitées, la provenance des visiteurs, leur pays, leur navigateur, leur système et leur type d'appareil, la durée de visite, la vitesse des pages, les erreurs, ainsi que les clics. Les données détaillées sont gardées 90 jours et les résumés quotidiens un an.</p>
        <p>Pour les visiteurs de l'Union européenne, de l'EEE, du Royaume-Uni, de Suisse et du Québec, les clics ne sont enregistrés qu'après acceptation. Pour les autres visiteurs, ils le sont sauf si leur navigateur envoie le signal Global Privacy Control, qui les bloque toujours, même après acceptation. Les pages visitées, la durée, la vitesse et les erreurs sont enregistrées pour tous, sans cookies et sans identifier personne. Ton choix est enregistré dans ton navigateur pendant 12 mois au plus.</p>
        <p><button type="button" onClick={openCookieSettings} className="underline">Modifier mes choix de cookies</button></p>
        <h2>Stockage dans ton navigateur</h2>
        <p>Le site garde ta session de connexion et ton choix sur la mesure d'audience dans ton navigateur. L'extension Chrome garde ta session dans le stockage de Chrome.</p>
        <h2>Tes droits</h2>
        <p>Tu peux demander l'accès, la correction ou la suppression de tes données en écrivant à <a className="underline" href="mailto:albkzk527@gmail.com">albkzk527@gmail.com</a>.</p>
      </div>
    </div>
  );
}
