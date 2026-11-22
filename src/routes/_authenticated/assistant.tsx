import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Send, Wand2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { generateMessage } from "@/lib/ai.functions";
import { planQuery, prospectsQuery } from "@/lib/queries";
import { canUse } from "@/lib/plans";
import { Link } from "@tanstack/react-router";
import { GmailPanel } from "@/components/GmailPanel";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "Assistant commercial — ScaleSaaS" }, { name: "description", content: "Messages de prospection et plan d'action générés par l'IA." }, { property: "og:title", content: "Assistant commercial IA" }, { property: "og:description", content: "Convertis tes prospects en clients." }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(prospectsQuery), context.queryClient.ensureQueryData(planQuery)]),
  component: Assistant,
});

const CHANNELS = ["E-mail", "SMS", "Message Instagram", "Script d'appel", "Visite en boutique"];
const TONES = ["Chaleureux", "Professionnel", "Direct"];

function Assistant() {
  const qc = useQueryClient();
  const { data: prospects } = useSuspenseQuery(prospectsQuery);
  const { data: me } = useSuspenseQuery(planQuery);
  const gen = useServerFn(generateMessage);
  const [pid, setPid] = useState(prospects[0]?.id ?? "");
  const [channel, setChannel] = useState(CHANNELS[0]!);
  const [tone, setTone] = useState(TONES[0]!);
  const [offer, setOffer] = useState("Site vitrine 490 € + 29 €/mois hébergement et maintenance");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const p = prospects.find((x) => x.id === pid);

  async function run() {
    if (!p) { toast.error("Ajoute d'abord un prospect depuis la Prospection."); return; }
    setLoading(true);
    try { setText((await gen({ data: { business: { name: p.name, category: p.category, address: p.address }, channel, tone, offer } })).text); }
    catch (e) { toast.error((e as Error).message); }
    setLoading(false);
  }

  async function markContacted() {
    if (!p) return;
    await supabase.from("prospects").update({ status: "contacté" }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["prospects"] });
    toast.success(`${p.name} marqué comme contacté`);
  }

  const Pill = ({ list, v, set }: { list: string[]; v: string; set: (s: string) => void }) => (
    <div className="flex flex-wrap gap-2">{list.map((x) => <button key={x} type="button" onClick={() => set(x)} className={`rounded-full border-2 px-3 py-1 text-xs font-medium ${v === x ? "border-ink bg-accent" : "border-border"}`}>{x}</button>)}</div>
  );

  if (!canUse(me.plan, "assistant", me.isAdmin)) return (
    <AppShell title="Assistant commercial" subtitle="Messages personnalisés, relances et plan pour signer tes clients.">
      <div className="max-w-lg rounded-2xl border-2 border-ink bg-card p-8 shadow-pop">
        <p className="font-display text-xl font-bold">Réservé aux formules Pro et Agence</p>
        <p className="mt-2 text-muted-foreground">Passe à la formule Pro pour générer tes messages de prospection avec l'IA.</p>
        <Button variant="hero" className="mt-5" asChild><Link to="/abonnement">Voir les abonnements</Link></Button>
      </div>
    </AppShell>
  );

  return (
    <AppShell title="Assistant commercial" subtitle="Messages personnalisés, relances et plan pour signer tes clients.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
          <label className="text-sm font-medium">Prospect
            <select value={pid} onChange={(e) => setPid(e.target.value)} className="mt-1.5 h-10 w-full rounded-md border bg-background px-2">
              {prospects.length === 0 && <option value="">Aucun prospect</option>}
              {prospects.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.status}</option>)}
            </select>
          </label>
          <div><p className="mb-2 text-sm font-medium">Canal</p><Pill list={CHANNELS} v={channel} set={setChannel} /></div>
          <div><p className="mb-2 text-sm font-medium">Ton</p><Pill list={TONES} v={tone} set={setTone} /></div>
          <label className="text-sm font-medium">Ton offre<Input className="mt-1.5" value={offer} onChange={(e) => setOffer(e.target.value)} /></label>
          <Button variant="hero" className="h-11" onClick={run} disabled={loading}><Wand2 /> {loading ? "Rédaction…" : "Générer"}</Button>
        </div>
        <div className="rounded-2xl border-2 border-ink bg-card p-6 shadow-pop lg:col-span-2">
          {text ? (
            <>
              <div className="mb-4 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copié"); }}><Copy /> Copier</Button>
                <Button size="sm" variant="ink" onClick={markContacted}><Send /> Marquer contacté</Button>
              </div>
              {channel === "E-mail" ? (
                <GmailPanel subject={`Un site web pour ${p?.name ?? "votre commerce"}`} body={text} onSent={markContacted} />
              ) : <div className="whitespace-pre-wrap text-sm leading-relaxed">{text}</div>}
            </>
          ) : <p className="text-muted-foreground">Choisis un prospect et génère ton message de prospection.</p>}
        </div>
      </div>
    </AppShell>
  );
}
