import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Lead SaaS" },
      { name: "description", content: "Crée ton compte Lead SaaS ou connecte-toi à ton espace." },
      { property: "og:title", content: "Connexion — Lead SaaS" },
      { property: "og:description", content: "Accède à ton agence web IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const GoogleG = () => (
  <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth" } });
      if (error) toast.error(error.message);
      else toast.success("Vérifie ta boîte mail pour confirmer ton compte.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("E-mail ou mot de passe incorrect.");
    }
    setLoading(false);
  }

  async function social(p: "google") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Connexion impossible.");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-ink-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="font-display text-2xl font-extrabold">Lead{" "}<span className="text-primary">SaaS</span></Link>
        <p className="font-display text-5xl font-extrabold leading-tight">Ton premier client est à <span className="text-primary">deux rues</span> d'ici.</p>
        <p className="text-sm opacity-60">Prospection · Sites IA · Vente</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-extrabold">{mode === "in" ? "Bon retour" : "Crée ton compte"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{mode === "in" ? "Connecte-toi à ton espace." : "Lance ton agence en 2 minutes."}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Button type="button" variant="outline" className="h-11" onClick={() => social("google")}><GoogleG /> Continuer avec Google</Button>
          </div>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" /></div>
            <div><Label htmlFor="pw">Mot de passe</Label><Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11" /></div>
            <Button type="submit" variant="hero" className="h-11" disabled={loading}>{mode === "in" ? "Se connecter" : "Créer mon compte"}</Button>
          </form>
          <button className="mt-6 text-sm text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Pas de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
          </button>
        </div>
      </div>
    </div>
  );
}
