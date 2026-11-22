import { describe, expect, it } from "vitest";
import { canAdd, canUse, PLANS } from "./plans";

describe("formules", () => {
  it("prix", () => { expect([PLANS.gratuit.price, PLANS.pro.price, PLANS.agence.price]).toEqual([5, 29, 79]); });
  it("gratuit : pas d'assistant", () => { expect(canUse("gratuit", "assistant")).toBe(false); expect(canUse("pro", "assistant")).toBe(true); });
  it("gratuit : 10 prospects max", () => { expect(canAdd("gratuit", "prospects", 9)).toBe(true); expect(canAdd("gratuit", "prospects", 10)).toBe(false); });
  it("gratuit : 1 site max, pro 20", () => { expect(canAdd("gratuit", "sites", 1)).toBe(false); expect(canAdd("pro", "sites", 19)).toBe(true); expect(canAdd("pro", "sites", 20)).toBe(false); });
  it("agence illimitée", () => { expect(canAdd("agence", "prospects", 100000)).toBe(true); });
  it("export réservé à Agence", () => { expect(canUse("pro", "export")).toBe(false); expect(canUse("agence", "export")).toBe(true); });
});

describe("restrictions v2", () => {
  it("pro : 50 prospects max", () => { expect(canAdd("pro", "prospects", 49)).toBe(true); expect(canAdd("pro", "prospects", 50)).toBe(false); });
  it("admin sans limite", () => { expect(canAdd("gratuit", "prospects", 500, true)).toBe(true); expect(canUse("gratuit", "assistant", true)).toBe(true); });
});

describe("pas d'abonnement", () => {
  it("ne peut rien faire", () => { expect(canAdd("aucun", "prospects", 0)).toBe(false); expect(canAdd("aucun", "sites", 0)).toBe(false); expect(canUse("aucun", "assistant")).toBe(false); });
});
