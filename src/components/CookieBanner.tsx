import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { needsAnswer, onConsentChange, readChoice, saveChoices } from "@/lib/consent";

export const OPEN_COOKIE_SETTINGS = "open-cookie-settings";
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS));
}

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [gpc, setGpc] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGpc((navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true);
    if (readChoice("analytics") == null) setOpen(true); else needsAnswer(["analytics"]).then((n) => n && setOpen(true));
    const show = () => { setAnalytics(readChoice("analytics") === "granted"); setSettings(true); setOpen(true); };
    window.addEventListener(OPEN_COOKIE_SETTINGS, show);
    const off = onConsentChange(() => setAnalytics(readChoice("analytics") === "granted"));
    return () => { window.removeEventListener(OPEN_COOKIE_SETTINGS, show); off(); };
  }, []);
  useEffect(() => { if (open) ref.current?.focus(); }, [open, settings]);

  if (!open) return null;
  const done = (c: "granted" | "denied") => { saveChoices({ analytics: c }); setOpen(false); setSettings(false); };

  return (
    <div ref={ref} tabIndex={-1} role="region" aria-label="Cookies" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border-2 border-ink bg-card p-5 shadow-pop outline-none">
      <p className="font-display text-lg font-bold">Ta vie privée</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Nous comptons les visites sans cookies. Si tu acceptes, nous mesurons aussi les clics. <Link to="/confidentialite" className="underline">Politique de confidentialité</Link>
      </p>
      {settings && (
        <div className="mt-4 space-y-3 text-sm">
          {gpc && <p className="rounded-md bg-accent p-2">Le signal de confidentialité de ton navigateur s'applique : la mesure reste désactivée.</p>}
          <div className="flex items-center justify-between rounded-md border p-3"><span>Nécessaires</span><span className="text-xs text-muted-foreground">Toujours actifs</span></div>
          <label className="flex items-center justify-between rounded-md border p-3">
            <span>Mesure d'audience, fournie par Lovable</span>
            <input type="checkbox" className="size-4 accent-primary" disabled={gpc} checked={analytics && !gpc} onChange={(e) => setAnalytics(e.target.checked)} />
          </label>
          <Button variant="ink" className="w-full" onClick={() => done(analytics ? "granted" : "denied")}>Enregistrer mes choix</Button>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => done("denied")}>Tout refuser</Button>
        <Button variant="outline" onClick={() => done("granted")}>Tout accepter</Button>
      </div>
      {!settings && <button type="button" onClick={() => setSettings(true)} className="mt-3 text-xs underline">Paramètres des cookies</button>}
    </div>
  );
}
