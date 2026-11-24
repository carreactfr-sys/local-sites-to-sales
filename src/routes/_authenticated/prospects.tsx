import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Globe, Phone, Plus, Star, Trash2, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProspectMap } from "@/components/ProspectMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { searchBusinesses, type PlaceResult } from "@/lib/maps.functions";
import { profileQuery, prospectsQuery, STATUSES } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/prospects")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Prospection — Lead SaaS" }, { name: "description", content: "Trouve des commerces sans site web sur la carte." }, { property: "og:title", content: "Prospection Lead SaaS" }, { property: "og:description", content: "Carte des commerces à démarcher." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(prospectsQuery), context.queryClient.ensureQueryData(profileQuery)]),
  component: Prospects,
});

const SECTORS = ["Restaurant", "Boulangerie", "Coiffeur", "Plombier", "Garage", "Fleuriste", "Institut de beauté", "Électricien"];

function Prospects() {
  const qc = useQueryClient();
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { data: saved } = useSuspenseQuery(prospectsQuery);
  const search = useServerFn(searchBusinesses);
  const [query, setQuery] = useState("Restaurant");
  const [city, setCity] = useState(profile?.city ?? "");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [onlyNoSite, setOnlyNoSite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const shown = useMemo(() => (onlyNoSite ? results.filter((r) => !r.website) : results), [results, onlyNoSite]);
  const points = useMemo(() => shown.map((r) => ({ id: r.place_id, name: r.name, lat: r.lat, lng: r.lng, hasSite: !!r.website })), [shown]);
  const savedIds = new Set(saved.map((s) => s.place_id));
  const onSelect = useCallback((id: string) => { setSelected(id); document.getElementById(`r-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, []);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { setResults(await search({ data: { query, city } })); }
    catch (err) { toast.error((err as Error).message); }
    setLoading(false);
  }

  async function save(r: PlaceResult) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("prospects").insert({ user_id: u.user!.id, ...r });
    if (error) { toast.error(error.message); return; }
    toast.success(`${r.name} ajouté`);
    qc.invalidateQueries({ queryKey: ["prospects"] });
  }

  async function update(id: string, patch: { status?: string; price?: number; monthly_fee?: number }) {
    const { error } = await supabase.from("prospects").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["prospects"] });
  }
  async function remove(id: string) {
    await supabase.from("prospects").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["prospects"] });
  }

  return (
    <AppShell title="Prospection" subtitle="Repère les commerces sans site web et ajoute-les à ta liste.">
      <form onSubmit={run} className="mb-4 flex flex-wrap gap-3">
        <Input list="sectors" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Secteur" className="h-11 max-w-56" />
        <datalist id="sectors">{SECTORS.map((s) => <option key={s} value={s} />)}</datalist>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" className="h-11 max-w-56" />
        <Button variant="hero" className="h-11" disabled={loading}><Search /> {loading ? "Recherche…" : "Rechercher"}</Button>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyNoSite} onChange={(e) => setOnlyNoSite(e.target.checked)} className="accent-primary" /> Sans site web uniquement</label>
      </form>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><ProspectMap points={points} onSelect={onSelect} /></div>
        <div className="max-h-[420px] overflow-y-auto rounded-2xl border bg-card lg:col-span-2">
          {shown.length === 0 && <p className="p-6 text-sm text-muted-foreground">{results.length ? "Tous ces commerces ont déjà un site. Décoche le filtre pour les voir." : "Lance une recherche pour voir les commerces."}</p>}
          {shown.map((r) => (
            <div key={r.place_id} id={`r-${r.place_id}`} className={cn("border-b p-4 last:border-0", selected === r.place_id && "bg-accent")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.category} · {r.address}</p>
                </div>
                <Button size="sm" variant={savedIds.has(r.place_id) ? "secondary" : "default"} disabled={savedIds.has(r.place_id)} onClick={() => save(r)}>
                  {savedIds.has(r.place_id) ? "Ajouté" : <><Plus /> Ajouter</>}
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-muted-foreground underline"><Globe className="size-3" />Site existant</a> : <Badge className="bg-primary text-primary-foreground">Pas de site</Badge>}
                {r.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{r.phone}</span>}
                {r.rating && <span className="flex items-center gap-1"><Star className="size-3" />{r.rating}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mb-4 mt-12 text-2xl font-bold">Ma liste ({saved.length})</h2>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Commerce</th><th className="p-3">Contact</th><th className="p-3">Statut</th><th className="p-3">Prix site €</th><th className="p-3">Abonnement €/mois</th><th /></tr></thead>
          <tbody>
            {saved.length === 0 && <tr><td colSpan={6} className="p-6 text-muted-foreground">Aucun prospect sauvegardé.</td></tr>}
            {saved.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3"><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.category}</p></td>
                <td className="p-3 text-xs">{p.phone ?? "—"}</td>
                <td className="p-3">
                  <select value={p.status} onChange={(e) => update(p.id, { status: e.target.value })} className="rounded-md border bg-background px-2 py-1">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3"><Input type="number" defaultValue={p.price} onBlur={(e) => Number(e.target.value) !== p.price && update(p.id, { price: Number(e.target.value) || 0 })} className="h-8 w-24" /></td>
                <td className="p-3"><Input type="number" defaultValue={p.monthly_fee} onBlur={(e) => Number(e.target.value) !== p.monthly_fee && update(p.id, { monthly_fee: Number(e.target.value) || 0 })} className="h-8 w-24" /></td>
                <td className="p-3"><Button size="icon" variant="ghost" onClick={() => remove(p.id)} aria-label="Supprimer"><Trash2 /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
