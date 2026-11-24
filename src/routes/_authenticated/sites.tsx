import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Sparkles, Copy, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { generateSite } from "@/lib/ai.functions";
import { prospectsQuery, sitesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/sites")({
  head: () => ({ meta: [{ title: "Sites IA — Lead SaaS" }, { name: "description", content: "Génère des sites vitrines avec l'IA." }, { property: "og:title", content: "Générateur de sites IA — Lead SaaS" }, { property: "og:description", content: "Un site pro en un clic." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(prospectsQuery), context.queryClient.ensureQueryData(sitesQuery)]),
  component: Sites,
});

const STYLES = ["Moderne & épuré", "Chaleureux & artisanal", "Luxe & élégant", "Coloré & dynamique"];

function download(name: string, html: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  a.download = `${name.replace(/\W+/g, "-").toLowerCase()}.html`;
  a.click();
}

function Sites() {
  const qc = useQueryClient();
  const { data: prospects } = useSuspenseQuery(prospectsQuery);
  const { data: sites } = useSuspenseQuery(sitesQuery);
  const gen = useServerFn(generateSite);
  const [pid, setPid] = useState<string>("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [style, setStyle] = useState(STYLES[0]!);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ title: string; html: string; prompt: string } | null>(null);

  const p = prospects.find((x) => x.id === pid);

  async function run() {
    const business = p ? { name: p.name, category: p.category, address: p.address, phone: p.phone } : { name, category };
    if (!business.name) { toast.error("Choisis un prospect ou saisis un nom."); return; }
    setLoading(true);
    try {
      const r = await gen({ data: { business, style, extra } });
      setPreview({ title: business.name, ...r });
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("sites").insert({ user_id: u.user!.id, prospect_id: p?.id ?? null, title: business.name, style, html: r.html, prompt: r.prompt });
      qc.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Site généré et sauvegardé");
    } catch (e) { toast.error((e as Error).message); }
    setLoading(false);
  }

  return (
    <AppShell title="Générateur de sites IA" subtitle="Choisis un commerce, un style, et l'IA crée son site vitrine.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
          <label className="text-sm font-medium">Prospect
            <select value={pid} onChange={(e) => setPid(e.target.value)} className="mt-1.5 h-10 w-full rounded-md border bg-background px-2">
              <option value="">— Saisie manuelle —</option>
              {prospects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          {!p && <>
            <Input placeholder="Nom du commerce" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Activité (ex : boulangerie)" value={category} onChange={(e) => setCategory(e.target.value)} />
          </>}
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => <button key={s} type="button" onClick={() => setStyle(s)} className={`rounded-lg border-2 p-2 text-xs font-medium ${style === s ? "border-ink bg-accent" : "border-border"}`}>{s}</button>)}
          </div>
          <Textarea placeholder="Détails : couleurs, services, horaires…" value={extra} onChange={(e) => setExtra(e.target.value)} />
          <Button variant="hero" className="h-11" onClick={run} disabled={loading}><Sparkles /> {loading ? "Génération (≈30 s)…" : "Générer le site"}</Button>
        </div>
        <div className="lg:col-span-2">
          {preview ? (
            <div className="rounded-2xl border-2 border-ink bg-card shadow-pop">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
                <p className="font-semibold">{preview.title}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(preview.prompt); toast.success("Prompt copié — colle-le dans Claude pour itérer"); }}><Copy /> Prompt</Button>
                  <Button size="sm" variant="ink" onClick={() => download(preview.title, preview.html)}><Download /> HTML</Button>
                </div>
              </div>
              <iframe title="Aperçu" srcDoc={preview.html} sandbox="allow-scripts" className="h-[600px] w-full rounded-b-2xl" />
            </div>
          ) : (
            <div className="flex h-full min-h-80 items-center justify-center rounded-2xl border-2 border-dashed text-muted-foreground grid-paper">L'aperçu apparaîtra ici</div>
          )}
        </div>
      </div>
      <h2 className="mb-4 mt-12 text-2xl font-bold">Mes sites ({sites.length})</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-4">
            <p className="font-semibold">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.style} · {new Date(s.created_at).toLocaleDateString("fr-FR")}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPreview({ title: s.title, html: s.html, prompt: s.prompt ?? "" })}>Voir</Button>
              <Button size="sm" variant="ghost" onClick={() => download(s.title, s.html)}><Download /></Button>
              <Button size="sm" variant="ghost" aria-label="Supprimer" onClick={async () => { await supabase.from("sites").delete().eq("id", s.id); qc.invalidateQueries({ queryKey: ["sites"] }); }}><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
