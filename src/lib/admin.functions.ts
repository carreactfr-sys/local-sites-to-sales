import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Accès réservé aux administrateurs");
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(error.message);
    const { data: subs } = await context.supabase.from("subscriptions").select("user_id, plan");
    const { data: profs } = await context.supabase.from("profiles").select("id, display_name");
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      name: profs?.find((p) => p.id === u.id)?.display_name ?? "",
      plan: subs?.find((s) => s.user_id === u.id)?.plan ?? "aucun",
      created_at: u.created_at,
    }));
  });

export const setUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string; plan: string }) => {
    if (!["aucun", "gratuit", "pro", "agence"].includes(i.plan)) throw new Error("Formule inconnue");
    return { userId: String(i.userId), plan: i.plan };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("subscriptions").upsert({ user_id: data.userId, plan: data.plan, source: "admin", granted_by: context.userId, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
