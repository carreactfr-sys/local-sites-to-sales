import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/extension-auth")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Connexion de l'extension — Lead SaaS" },
      { name: "description", content: "Autorise l'extension Chrome Lead SaaS à accéder à ton compte." },
      { property: "og:title", content: "Connexion de l'extension — Lead SaaS" },
      { property: "og:description", content: "Relie l'extension Chrome à ton compte Lead SaaS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExtensionAuth,
});

const KEY = "scalesaas_ext_redirect";
// Only Chrome extension identity redirect URLs are accepted.
const valid = (u: string | null) => !!u && /^https:\/\/[a-p]{32}\.chromiumapp\.org\/[^#]*$/.test(u);

function ExtensionAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [redirect, setRedirect] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("redirect");
    if (valid(q)) sessionStorage.setItem(KEY, q!);
    const r = sessionStorage.getItem(KEY);
    setRedirect(valid(r) ? r : null);
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  function authorize() {
    if (!session || !redirect) return;
    sessionStorage.removeItem(KEY);
    const h = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: String(session.expires_at ?? Math.floor(Date.now() / 1000) + 3600),
    });
    window.location.replace(`${redirect}#${h.toString()}`);
  }

  async function google() {
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/extension-auth" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="font-display text-2xl font-extrabold">Lead{" "}<span className="text-primary">SaaS</span></p>
        {!ready ? null : !redirect ? (
          <p className="mt-6 text-sm text-muted-foreground">Ouvre cette page depuis l'extension Chrome Lead SaaS.</p>
        ) : session ? (
          <>
            <h1 className="mt-6 text-xl font-extrabold">Autoriser l'extension ?</h1>
            <p className="mt-2 text-sm text-muted-foreground">L'extension Chrome Lead SaaS pourra accéder au compte <b>{session.user.email}</b>.</p>
            <Button variant="hero" className="mt-6 h-11 w-full" onClick={authorize}>Autoriser</Button>
            <button className="mt-4 text-sm text-muted-foreground underline" onClick={() => supabase.auth.signOut()}>Utiliser un autre compte</button>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-xl font-extrabold">Connexion avec Google</h1>
            <p className="mt-2 text-sm text-muted-foreground">Utilise ton compte Lead SaaS habituel.</p>
            <Button variant="outline" className="mt-6 h-11 w-full" onClick={google}>Continuer avec Google</Button>
          </>
        )}
      </div>
    </div>
  );
}
