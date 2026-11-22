import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { planForStatus } from "@/lib/billing";

async function syncSubscription(sub: any, env: StripeEnv, deleted = false) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || null;
  const status = deleted ? "canceled" : sub.status;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;
  let userId: string | undefined = sub.metadata?.userId;
  if (!userId) {
    const { data } = await supabaseAdmin.from("subscriptions").select("user_id").eq("stripe_subscription_id", sub.id).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) { console.error("Abonnement sans utilisateur", sub.id); return; }
  // Une résiliation n'écrase pas une formule offerte ensuite par l'admin ou un autre abonnement.
  if (deleted || planForStatus(priceId, status) === "aucun") {
    const { data: cur } = await supabaseAdmin.from("subscriptions").select("source, stripe_subscription_id").eq("user_id", userId).maybeSingle();
    if (cur && (cur.source !== "stripe" || cur.stripe_subscription_id !== sub.id)) return;
  }
  const { error } = await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    plan: planForStatus(priceId, status),
    source: "stripe",
    stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    environment: env,
    granted_by: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        try {
          const event = await verifyWebhook(request, rawEnv);
          if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") await syncSubscription(event.data.object, rawEnv);
          else if (event.type === "customer.subscription.deleted") await syncSubscription(event.data.object, rawEnv, true);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
