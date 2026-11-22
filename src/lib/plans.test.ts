import { describe, expect, it } from "vitest";
import { canAdd, canUse, PLANS } from "./plans";

describe("formules", () => {
  it("prix", () => { expect([PLANS.gratuit.price, PLANS.pro.price, PLANS.agence.price]).toEqual([0, 29, 79]); });
  it("gratuit : pas d'assistant", () => { expect(canUse("gratuit", "assistant")).toBe(false); expect(canUse("pro", "assistant")).toBe(true); });
  it("gratuit : 10 prospects max", () => { expect(canAdd("gratuit", "prospects", 9)).toBe(true); expect(canAdd("gratuit", "prospects", 10)).toBe(false); });
  it("gratuit : 1 site max, pro 20", () => { expect(canAdd("gratuit", "sites", 1)).toBe(false); expect(canAdd("pro", "sites", 19)).toBe(true); expect(canAdd("pro", "sites", 20)).toBe(false); });
  it("agence illimitée", () => { expect(canAdd("agence", "prospects", 100000)).toBe(true); });
  it("export réservé à Agence", () => { expect(canUse("pro", "export")).toBe(false); expect(canUse("agence", "export")).toBe(true); });
});
