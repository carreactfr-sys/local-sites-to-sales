import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SupportDesk } from "@/components/SupportDesk";
import { Input } from "@/components/ui/input";
import { planQuery } from "@/lib/queries";
import { listUsers, setUserPlan } from "@/lib/admin.functions";
import { PLANS, type PlanId } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Administration — Lead SaaS" }, { name: "description", content: "Gère les abonnements des utilisateurs." }, { property: "og:title", content: "Administration Lead SaaS" }, { property: "og:description", content: "Attribue les formules aux utilisateurs." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(planQuery),
  component: Admin,
});

function Admin() {
  const { data: me } = useSuspenseQuery(planQuery);
  const list = useServerFn(listUsers);
  const setPlan = useServerFn(setUserPlan);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => list(), enabled: me.isAdmin });

  if (!me.isAdmin) return <AppShell title="Administration"><p className="text-muted-foreground">Cette page est réservée aux administrateurs.</p></AppShell>;

  async function change(userId: string, plan: string) {
    try { await setPlan({ data: { userId, plan } }); toast.success(plan === "aucun" ? "Abonnement retiré" : `Formule ${PLANS[plan as PlanId].name} attribuée`); qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["plan"] }); }
    catch (e) { toast.error((e as Error).message); }
  }
  const rows = (users.data ?? []).filter((u) => `${u.email} ${u.name}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell title="Administration" subtitle="Attribue gratuitement une formule à n'importe quel utilisateur.">
      <Input className="mb-4 max-w-sm" placeholder="Rechercher un e-mail ou un nom" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-hidden rounded-2xl border bg-card">
        {users.isLoading && <p className="p-6 text-muted-foreground">Chargement…</p>}
        {users.error && <p className="p-6 text-destructive">{(users.error as Error).message}</p>}
        {rows.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 border-b p-4 last:border-0">
            <div><p className="font-medium">{u.name || u.email}</p><p className="text-sm text-muted-foreground">{u.email}</p></div>
            <select aria-label={`Formule de ${u.email}`} value={u.plan} onChange={(e) => change(u.id, e.target.value)} className="h-10 rounded-md border bg-background px-2 text-sm">
              {(Object.keys(PLANS) as PlanId[]).map((id) => <option key={id} value={id}>{PLANS[id].name}</option>)}
            </select>
          </div>
        ))}
      </div>
      <h2 className="mb-4 mt-12 text-2xl font-extrabold">Demandes de support</h2>
      <SupportDesk admin />
    </AppShell>
  );
}
