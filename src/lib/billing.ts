import type { PlanId } from "./plans";

/** Correspondance prix de paiement → formule de l'app. */
export const PRICE_TO_PLAN: Record<string, Exclude<PlanId, "aucun">> = {
  starter_monthly: "gratuit",
  pro_monthly: "pro",
  agence_monthly: "agence",
};
export const PLAN_TO_PRICE: Record<string, string> = { gratuit: "starter_monthly", pro: "pro_monthly", agence: "agence_monthly" };

/** Formule à appliquer selon le statut de l'abonnement payé. */
export function planForStatus(priceId: string | null | undefined, status: string): PlanId {
  const plan = priceId ? PRICE_TO_PLAN[priceId] : undefined;
  if (!plan) return "aucun";
  return ["active", "trialing", "past_due"].includes(status) ? plan : "aucun";
}
