import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GmailPanel({ subject: initialSubject, body: initialBody, onSent }: { subject: string; body: string; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  useEffect(() => setBody(initialBody), [initialBody]);
  useEffect(() => setSubject(initialSubject), [initialSubject]);

  function openGmail() {
    const params = new URLSearchParams({ view: "cm", fs: "1", to: to.trim(), su: subject, body });
    window.open(`https://mail.google.com/mail/?${params.toString()}`, "_blank", "noopener");
    onSent();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2 text-sm"><Mail className="size-4 text-primary" /> Prépare ton e-mail, puis ouvre-le dans Gmail.</div>
      <Input placeholder="E-mail du commerçant (optionnel)" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
      <Input placeholder="Objet" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className="min-h-48 rounded-md border bg-card p-3 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
      <Button variant="ink" onClick={openGmail}><Mail /> Ouvrir dans Gmail</Button>
    </div>
  );
}
