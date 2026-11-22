import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { planQuery } from "@/lib/queries";
import { PLANS, type PlanId } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/abonnement")({
  head: () => ({ meta: [{ title: "Abonnement — ScaleSaaS" }, { name: "description", content: "Choisis la formule ScaleSaaS adaptée à ton activité." }, { property: "og:title", content: "Abonnements ScaleSaaS" }, { property: "og:description", content: "Gratuit, Pro ou Agence." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(planQuery),
  component: Abonnement,
});

function Abonnement() {
  const { data } = useSuspenseQuery(planQuery);
  return (
    <AppShell title="Abonnement" action={data.isAdmin ? <span className="rounded-xl border-2 border-ink bg-card px-3 py-1.5 text-sm font-semibold shadow-pop">Admin · accès illimité</span> : undefined} subtitle="Choisis la formule qui suit le rythme de ton agence.">
      <div className="grid gap-6 md:grid-cols-3">
        {(Object.keys(PLANS) as PlanId[]).filter((id) => id !== "aucun").map((id) => {
          const p = PLANS[id]; const current = data.plan === id;
          return (
            <div key={id} className={`flex flex-col rounded-2xl border-2 bg-card p-6 border-ink shadow-pop`}>
              <div className="flex items-center justify-between"><p className="font-display text-xl font-bold">{p.name}</p>{id === "pro" && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold">Populaire</span>}</div>
              <p className="mt-2"><span className="text-4xl font-extrabold">{p.price} €</span><span className="text-muted-foreground"> /mois</span></p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">{p.perks.map((k) => <li key={k} className="flex gap-2"><Check className="size-4 text-primary" />{k}</li>)}</ul>
              {current ? <Button className="mt-6" variant="outline" disabled>Ta formule actuelle</Button>
                : <Button className="mt-6" variant={id === "pro" ? "hero" : "ink"} asChild><a href={`mailto:albkzk527@gmail.com?subject=${encodeURIComponent(`Passer à la formule ${p.name}`)}`}>Demander {p.name}</a></Button>}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Le paiement en ligne arrive bientôt. En attendant, demande ta formule et nous l'activons sur ton compte.</p>
    </AppShell>
  );
}
