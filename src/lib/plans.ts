export type PlanId = "gratuit" | "pro" | "agence";
export type Feature = "assistant" | "export";

export const PLANS: Record<PlanId, { name: string; price: number; prospects: number | null; sites: number | null; features: Feature[]; perks: string[] }> = {
  gratuit: { name: "Gratuit", price: 0, prospects: 10, sites: 1, features: [], perks: ["10 prospects", "1 site IA", "Extension Chrome"] },
  pro: { name: "Pro", price: 29, prospects: 200, sites: 20, features: ["assistant"], perks: ["200 prospects", "20 sites IA", "Assistant commercial IA", "Ouverture dans Gmail"] },
  agence: { name: "Agence", price: 79, prospects: null, sites: null, features: ["assistant", "export"], perks: ["Prospects illimités", "Sites IA illimités", "Assistant commercial IA", "Téléchargement du code des sites"] },
};

export function asPlan(v: string | null | undefined): PlanId {
  return v === "pro" || v === "agence" ? v : "gratuit";
}
export function canUse(plan: PlanId, f: Feature) {
  return PLANS[plan].features.includes(f);
}
export function canAdd(plan: PlanId, kind: "prospects" | "sites", count: number) {
  const lim = PLANS[plan][kind];
  return lim === null || count < lim;
}
