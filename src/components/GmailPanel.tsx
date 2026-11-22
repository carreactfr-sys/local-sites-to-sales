import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeGmailConnect, disconnectGmail, getGmailStatus, sendGmail, startGmailConnect } from "@/lib/gmail.functions";

function waitForPopup(popup: Window) {
  return new Promise<string | null>((resolve, reject) => {
    const cleanup = () => { window.removeEventListener("message", onMsg); window.clearInterval(poll); };
    const onMsg = (e: MessageEvent) => {
      const t = e.data?.type;
      if (e.origin !== window.location.origin || e.source !== popup || e.data?.connectorId !== "google_mail" || (t !== "appUserConnectorOAuthComplete" && t !== "appUserConnectorOAuthFailed")) return;
      cleanup();
      if (t === "appUserConnectorOAuthComplete") resolve(typeof e.data?.code === "string" ? e.data.code : null);
      else reject(new Error("Connexion Gmail échouée."));
    };
    window.addEventListener("message", onMsg);
    const poll = window.setInterval(() => { if (popup.closed) { cleanup(); reject(new Error("Fenêtre fermée avant la fin.")); } }, 500);
  });
}

export function GmailPanel({ subject: initialSubject, body: initialBody, onSent }: { subject: string; body: string; onSent: () => void }) {
  const qc = useQueryClient();
  const status = useServerFn(getGmailStatus);
  const start = useServerFn(startGmailConnect);
  const complete = useServerFn(completeGmailConnect);
  const disconnect = useServerFn(disconnectGmail);
  const send = useServerFn(sendGmail);
  const { data, isLoading } = useQuery({ queryKey: ["gmail-status"], queryFn: () => status() });
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [busy, setBusy] = useState(false);
  useEffect(() => setBody(initialBody), [initialBody]);
  useEffect(() => setSubject(initialSubject), [initialSubject]);

  async function connect() {
    const popup = window.open("", "gmail-oauth", "width=600,height=720");
    if (!popup) { toast.error("Autorise les fenêtres pop-up puis réessaie."); return; }
    try {
      const { authorizationUrl } = await start();
      const wait = waitForPopup(popup);
      popup.location.href = authorizationUrl;
      const code = await wait;
      if (code) await complete({ data: { code } });
      await qc.invalidateQueries({ queryKey: ["gmail-status"] });
      toast.success(data?.reconnectRequired ? "Gmail reconnecté" : "Gmail connecté");
    } catch (e) { popup.close(); toast.error((e as Error).message); }
  }

  async function doSend() {
    setBusy(true);
    try { await send({ data: { to: to.trim(), subject, body } }); toast.success(`E-mail envoyé à ${to}`); onSent(); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  }

  if (isLoading) return <div className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">Vérification de Gmail…</div>;

  if (!data?.connected) return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2 text-sm">
        <Mail className="size-4 text-primary" />
        {data?.reconnectRequired ? "Ton accès Gmail doit être renouvelé." : "Connecte ton Gmail pour envoyer directement depuis ScaleSaaS."}
      </div>
      <Button size="sm" variant="outline" onClick={connect}>{data?.reconnectRequired ? "Reconnecter Gmail" : "Connecter Gmail"}</Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2"><Mail className="size-4 text-primary" /> Envoi depuis <b>{data.email}</b></span>
        <button className="text-xs text-muted-foreground hover:underline" onClick={async () => { await disconnect(); qc.invalidateQueries({ queryKey: ["gmail-status"] }); toast.success("Gmail déconnecté"); }}>Déconnecter</button>
      </div>
      <Input placeholder="E-mail du commerçant" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
      <Input placeholder="Objet" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className="min-h-48 rounded-md border bg-card p-3 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
      <Button variant="ink" onClick={doSend} disabled={busy || !to}><Send /> {busy ? "Envoi…" : "Envoyer avec Gmail"}</Button>
    </div>
  );
}
