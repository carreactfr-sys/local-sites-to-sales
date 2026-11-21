import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Bienvenue — ScaleSaaS" }, { name: "description", content: "Personnalise ton espace ScaleSaaS." }, { property: "og:title", content: "Onboarding ScaleSaaS" }, { property: "og:description", content: "Personnalise ton parcours." }] }),
  component: Onboarding,
});

const EXP = ["Débutant total", "J'ai déjà vendu un service", "Freelance confirmé"];
const SKILLS = ["Vente", "Design", "Rédaction", "Réseaux sociaux", "Technique", "Aucune pour l'instant"];
const GOALS = ["Revenu complémentaire", "Vivre de mon agence", "Tester l'idée"];

function Choice({ options, value, onChange, multi }: { options: string[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])}
            className={cn("rounded-xl border-2 p-4 text-left font-medium transition-all", on ? "border-ink bg-accent shadow-pop" : "border-border bg-card hover:border-ink")}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [exp, setExp] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [goal, setGoal] = useState<string[]>([]);
  const [target, setTarget] = useState("2000");
  const [city, setCity] = useState("");

  const steps = [
    { q: "Quelle est ton expérience ?", ok: exp.length > 0, el: <Choice options={EXP} value={exp} onChange={setExp} /> },
    { q: "Tes compétences ?", ok: skills.length > 0, el: <Choice options={SKILLS} value={skills} onChange={setSkills} multi /> },
    { q: "Ton objectif ?", ok: goal.length > 0, el: <Choice options={GOALS} value={goal} onChange={setGoal} /> },
    {
      q: "Où et combien ?", ok: city.trim().length > 1 && Number(target) > 0,
      el: (
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium">Ta ville de prospection<Input className="mt-1.5 h-11" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lyon" /></label>
          <label className="text-sm font-medium">Objectif de revenus mensuel (€)<Input className="mt-1.5 h-11" type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
        </div>
      ),
    },
  ];
  const cur = steps[step]!;

  async function finish() {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").upsert({
      id: u.user!.id, experience: exp[0], skills, goal: goal[0], monthly_target: Number(target), city: city.trim(), onboarded: true, updated_at: new Date().toISOString(),
    });
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["profile"] });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid-paper">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Étape {step + 1} / {steps.length}</p>
        <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <div className="mt-10 rounded-2xl border-2 border-ink bg-card p-8 shadow-pop">
          <h1 className="mb-6 text-3xl font-extrabold">{cur.q}</h1>
          {cur.el}
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Retour</Button>
            {step < steps.length - 1
              ? <Button variant="hero" disabled={!cur.ok} onClick={() => setStep(step + 1)}>Suivant</Button>
              : <Button variant="hero" disabled={!cur.ok} onClick={finish}>Créer mon espace</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
