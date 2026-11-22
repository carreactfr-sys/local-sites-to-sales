import { describe, expect, it } from "vitest";
import { planForStatus } from "./billing";

describe("paiement → formule", () => {
  it("payer 29 € donne Pro", () => { expect(planForStatus("pro_monthly", "active")).toBe("pro"); });
  it("5 € donne Starter, 79 € donne Agence", () => { expect(planForStatus("starter_monthly", "active")).toBe("gratuit"); expect(planForStatus("agence_monthly", "active")).toBe("agence"); });
  it("résilié ou impayé : plus d'abonnement", () => { expect(planForStatus("pro_monthly", "canceled")).toBe("aucun"); expect(planForStatus("pro_monthly", "unpaid")).toBe("aucun"); });
});
