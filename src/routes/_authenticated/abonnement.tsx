import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { planQuery } from "@/lib/queries";
import { PLANS, type PlanId } from "@/lib/plans";
import { PLAN_TO_PRICE } from "@/lib/billing";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession, createPortalSession } from "@/utils/payments.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/abonnement")({
  head: () => ({ meta: [{ title: "Abonnement — ScaleSaaS" }, { name: "description", content: "Choisis la formule ScaleSaaS adaptée à ton activité." }, { property: "og:title", content: "Abonnements ScaleSaaS" }, { property: "og:description", content: "Starter, Pro ou Agence." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(planQuery),
  component: Abonnement,
});

function Checkout({ priceId }: { priceId: string }) {
  const create = useServerFn(createCheckoutSession);
  const fetchClientSecret = async () => {
    const r = await create({ data: { priceId, environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/abonnement?paiement=ok` } });
    if ("error" in r) throw new Error(r.error);
    return r.clientSecret;
  };
  return <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>;
}

function Abonnement() {
  const { data } = useSuspenseQuery(planQuery);
  const qc = useQueryClient();
  const portal = useServerFn(createPortalSession);
  const [buying, setBuying] = useState<string | null>(null);
  const sub = useQuery({
    queryKey: ["my-sub"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: s } = await supabase.from("subscriptions").select("source, status, stripe_customer_id, cancel_at_period_end, current_period_end").eq("user_id", u.user!.id).maybeSingle();
      return s;
    },
  });
  const paid = sub.data?.source === "stripe" && data.plan !== "aucun";

  async function openPortal() {
    try {
      const r = await portal({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
      if ("error" in r) throw new Error(r.error);
      window.open(r.url, "_blank");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell title="Abonnement" action={data.isAdmin ? <span className="rounded-xl border-2 border-ink bg-card px-3 py-1.5 text-sm font-semibold shadow-pop">Admin · accès illimité</span> : undefined} subtitle="Choisis la formule qui suit le rythme de ton agence.">
      <PaymentTestModeBanner />
      {data.plan === "aucun" && !data.isAdmin && <p className="mb-4 rounded-xl border-2 border-ink bg-card p-4 text-sm font-medium shadow-pop">Tu n'as pas encore d'abonnement : choisis une formule pour commencer.</p>}
      {paid && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm">
          <span>{sub.data?.cancel_at_period_end ? "Ton abonnement s'arrête à la fin de la période." : "Ton abonnement est actif."} Pour changer de formule ou résilier :</span>
          <Button variant="outline" onClick={openPortal}>Gérer mon abonnement</Button>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        {(Object.keys(PLANS) as PlanId[]).filter((id) => id !== "aucun").map((id) => {
          const p = PLANS[id]; const current = data.plan === id;
          return (
            <div key={id} className="flex flex-col rounded-2xl border-2 border-ink bg-card p-6 shadow-pop">
              <div className="flex items-center justify-between"><p className="font-display text-xl font-bold">{p.name}</p>{id === "pro" && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold">Populaire</span>}</div>
              <p className="mt-2"><span className="text-4xl font-extrabold">{p.price} €</span><span className="text-muted-foreground"> /mois</span></p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">{p.perks.map((k) => <li key={k} className="flex gap-2"><Check className="size-4 text-primary" />{k}</li>)}</ul>
              {current ? <Button className="mt-6" variant="outline" disabled>Ta formule actuelle</Button>
                : paid ? <Button className="mt-6" variant="ink" onClick={openPortal}>Changer pour {p.name}</Button>
                : <Button className="mt-6" variant={id === "pro" ? "hero" : "ink"} onClick={() => setBuying(PLAN_TO_PRICE[id] ?? null)}>S'abonner à {p.name}</Button>}
            </div>
          );
        })}
      </div>
      <Dialog open={!!buying} onOpenChange={(o) => { if (!o) { setBuying(null); qc.invalidateQueries({ queryKey: ["plan"] }); qc.invalidateQueries({ queryKey: ["my-sub"] }); } }}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>Paiement sécurisé</DialogTitle></DialogHeader>
          {buying && <Checkout priceId={buying} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
