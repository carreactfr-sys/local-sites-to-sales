import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function planFromProduct(d: Record<string, unknown>): "gratuit" | "pro" | "agence" | null {
  const txt = JSON.stringify([d["product"], d["plan"], d["access_pass"], d["plan_id"], d["product_id"]]).toLowerCase();
  if (txt.includes("plan_biyqqgpdyi8bq")) return "agence";
  if (txt.includes("plan_nvugp1batca4o")) return "pro";
  if (txt.includes("plan_uzihuvltr3mlq")) return "gratuit";
  if (txt.includes("agence")) return "agence";
  if (txt.includes("starter")) return "gratuit";
  if (txt.includes("pro")) return "pro";
  return null;
}

function verify(secret: string, id: string, ts: string, sigHeader: string, body: string) {
  const key = secret.startsWith("whsec_") ? Buffer.from(secret.slice(6), "base64") : Buffer.from(secret, "utf8");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  return sigHeader.split(" ").some((part) => {
    const sig = part.includes(",") ? part.split(",")[1]! : part;
    const a = Buffer.from(sig); const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export const Route = createFileRoute("/api/public/whop/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secrets = [process.env["WHOP_WEBHOOK_SECRET"], process.env["WHOP_SANDBOX_WEBHOOK_SECRET"]].filter((x): x is string => !!x);
        if (!secrets.length) return new Response("Not configured", { status: 500 });
        const body = await request.text();
        const id = request.headers.get("webhook-id") ?? "";
        const ts = request.headers.get("webhook-timestamp") ?? "";
        const sig = request.headers.get("webhook-signature") ?? "";
        if (!id || !ts || !sig || !secrets.some((k) => verify(k, id, ts, sig, body))) return new Response("Invalid signature", { status: 401 });
        if (Math.abs(Date.now() / 1000 - Number(ts)) > 600) return new Response("Stale", { status: 401 });

        let evt: { type?: string; action?: string; data?: Record<string, unknown> };
        try { evt = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }
        const type = String(evt.type ?? evt.action ?? "").replaceAll("_", ".");
        const d = evt.data ?? {};
        const user = (d["user"] ?? {}) as Record<string, unknown>;
        const member = (d["member"] ?? {}) as Record<string, unknown>;
        const email = String(user["email"] ?? member["email"] ?? d["email"] ?? (d["billing_address"] as Record<string, unknown> | undefined)?.["email"] ?? "").toLowerCase().trim();
        console.log("[whop] event", type, "email?", !!email, "keys", Object.keys(d).join(","), "user", JSON.stringify(user).slice(0, 300), "plan", JSON.stringify(d["plan"] ?? d["plan_id"] ?? null).slice(0, 200));
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const log = (result: string) => supabaseAdmin.from("whop_events").insert({ event_type: type, email: email || null, result, payload: evt as never });
        if (!email) { await log("e-mail absent (permission member:email:read manquante ?)"); return new Response("ok"); }
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const u = list?.users.find((x) => x.email?.toLowerCase() === email);
        if (!u) { await log("aucun compte avec cet e-mail"); return new Response("ok"); }

        let plan: string | null = null;
        if (type.startsWith("membership.activated") || type === "membership.went_valid" || type.startsWith("payment.succeeded")) plan = planFromProduct(d);
        else if (type.startsWith("membership.deactivated") || type === "membership.went_invalid") plan = "aucun";
        if (!plan) { await log("événement ignoré ou formule non reconnue"); return new Response("ok"); }

        await supabaseAdmin.from("subscriptions").upsert({ user_id: u.id, plan, source: "whop", status: plan === "aucun" ? "canceled" : "active" }, { onConflict: "user_id" });
        await log("formule appliquée : " + plan);
        return new Response("ok");
      },
    },
  },
});
