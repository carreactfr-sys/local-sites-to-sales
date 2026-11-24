import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS: Record<string, string> = { ouverte: "En attente", "répondue": "Répondue", "fermée": "Fermée" };
const fmt = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

export function SupportDesk({ admin = false }: { admin?: boolean }) {
  const qc = useQueryClient();
  const [sel, setSel] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [first, setFirst] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const tickets = useQuery({
    queryKey: ["support-tickets"],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const cur = tickets.data?.find((t) => t.id === sel) ?? null;
  const msgs = useQuery({
    queryKey: ["support-messages", sel],
    enabled: !!sel,
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.from("support_messages").select("*").eq("ticket_id", sel!).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["support-tickets"] }); qc.invalidateQueries({ queryKey: ["support-messages"] }); };

  async function create() {
    if (!subject.trim() || !first.trim()) { toast.error("Indique un sujet et ton message."); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: t, error } = await supabase.from("support_tickets").insert({ subject: subject.trim().slice(0, 150), user_email: u.user?.email ?? null }).select().single();
    if (error || !t) { toast.error("Impossible d'envoyer la demande."); setBusy(false); return; }
    const { error: e2 } = await supabase.from("support_messages").insert({ ticket_id: t.id, body: first.trim().slice(0, 5000) });
    setBusy(false);
    if (e2) { toast.error("Impossible d'envoyer le message."); return; }
    setSubject(""); setFirst(""); setSel(t.id); refresh(); toast.success("Demande envoyée, tu recevras la réponse ici.");
  }

  async function send() {
    if (!sel || !reply.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("support_messages").insert({ ticket_id: sel, body: reply.trim().slice(0, 5000), from_admin: admin });
    setBusy(false);
    if (error) { toast.error("Message non envoyé."); return; }
    setReply(""); refresh();
  }

  async function close() {
    if (!sel) return;
    await supabase.from("support_tickets").update({ status: "fermée" }).eq("id", sel);
    refresh(); toast.success("Demande fermée");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-4">
        {!admin && (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-card p-5 shadow-pop">
            <p className="font-display text-lg font-bold">Nouvelle demande</p>
            <Input placeholder="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <textarea placeholder="Décris ton problème…" value={first} onChange={(e) => setFirst(e.target.value)} className="min-h-28 rounded-md border bg-background p-2 text-sm" />
            <Button variant="hero" onClick={create} disabled={busy}><Send /> Envoyer</Button>
          </div>
        )}
        <div className="rounded-2xl border bg-card p-2">
          {tickets.data?.length === 0 && <p className="p-3 text-sm text-muted-foreground">Aucune demande pour l'instant.</p>}
          {tickets.data?.map((t) => (
            <button key={t.id} type="button" onClick={() => setSel(t.id)} className={`flex w-full flex-col gap-1 rounded-lg p-3 text-left ${sel === t.id ? "bg-accent" : "hover:bg-muted"}`}>
              <span className="flex items-center justify-between gap-2"><span className="truncate font-medium">{t.subject}</span>
                <span className={`shrink-0 rounded-full border px-2 text-xs ${(admin ? t.status === "ouverte" : t.status === "répondue") ? "border-ink bg-primary text-primary-foreground" : ""}`}>{STATUS[t.status] ?? t.status}</span></span>
              <span className="text-xs text-muted-foreground">{admin && t.user_email ? `${t.user_email} · ` : ""}{fmt(t.updated_at)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-96 flex-col rounded-2xl border-2 border-ink bg-card p-5 shadow-pop lg:col-span-2">
        {!cur ? <p className="text-muted-foreground">{admin ? "Choisis une demande pour y répondre." : "Choisis une demande pour voir la conversation."}</p> : (
          <>
            <div className="mb-4 flex items-start justify-between gap-3 border-b pb-3">
              <div><p className="font-display text-lg font-bold">{cur.subject}</p>{admin && <p className="text-xs text-muted-foreground">{cur.user_email}</p>}</div>
              {cur.status !== "fermée" && <Button size="sm" variant="outline" onClick={close}>Fermer</Button>}
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {msgs.data?.map((m) => {
                const mine = m.from_admin === admin;
                return (
                  <div key={m.id} className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${mine ? "self-end bg-primary text-primary-foreground" : "self-start border bg-background"}`}>
                    <p className="mb-1 text-xs opacity-70">{m.from_admin ? "Support ScaleSaaS" : admin ? "Utilisateur" : "Toi"} · {fmt(m.created_at)}</p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <textarea placeholder={admin ? "Ta réponse…" : "Ajouter un message…"} value={reply} onChange={(e) => setReply(e.target.value)} className="min-h-12 flex-1 rounded-md border bg-background p-2 text-sm" />
              <Button variant="hero" onClick={send} disabled={busy || !reply.trim()}><Send /> {admin ? "Répondre" : "Envoyer"}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
