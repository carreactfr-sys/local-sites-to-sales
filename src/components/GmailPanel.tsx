import { useEffect, useState } from "react";
import { Copy, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GmailPanel({ subject: initialSubject, body: initialBody, onSent }: { subject: string; body: string; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  useEffect(() => setBody(initialBody), [initialBody]);
  useEffect(() => setSubject(initialSubject), [initialSubject]);

  const gmailUrl = `https://mail.google.com/mail/?${new URLSearchParams({ view: "cm", fs: "1", to: to.trim(), su: subject, body }).toString()}`;
  const mailtoUrl = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(`Objet : ${subject}\n\n${body}`);
      toast.success("E-mail copié");
    } catch {
      toast.error("Impossible de copier");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2 text-sm"><Mail className="size-4 text-primary" /> Prépare ton e-mail, puis ouvre-le dans Gmail.</div>
      <Input placeholder="E-mail du commerçant (optionnel)" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
      <Input placeholder="Objet" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className="min-h-48 rounded-md border bg-card p-3 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
      <Button variant="ink" asChild>
        <a href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={onSent}><Mail /> Ouvrir dans Gmail</a>
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" asChild>
          <a href={mailtoUrl} onClick={onSent}><Send /> Mon app e-mail</a>
        </Button>
        <Button variant="outline" onClick={copyEmail}><Copy /> Copier l'e-mail</Button>
      </div>
    </div>
  );
}
