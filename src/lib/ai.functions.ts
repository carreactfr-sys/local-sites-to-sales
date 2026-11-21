import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function chat(system: string, user: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Clé IA manquante");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429) throw new Error("Trop de demandes, réessaie dans un instant.");
  if (res.status === 402) throw new Error("Crédits IA épuisés.");
  if (!res.ok) {
    const t = await res.text();
    console.error(`AI failed [${res.status}]: ${t}`);
    throw new Error(`Erreur IA [${res.status}]`);
  }
  const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return j.choices?.[0]?.message?.content ?? "";
}

type Biz = { name: string; category?: string | null; address?: string | null; phone?: string | null };

export const generateSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { business: Biz; style: string; extra: string }) => ({
    business: { ...i.business, name: String(i.business?.name ?? "").slice(0, 120) },
    style: String(i.style ?? "moderne").slice(0, 60),
    extra: String(i.extra ?? "").slice(0, 1000),
  }))
  .handler(async ({ data }) => {
    const b = data.business;
    const prompt = `Crée le site vitrine d'une page pour "${b.name}" (${b.category ?? "commerce local"}), situé ${b.address ?? ""}, téléphone ${b.phone ?? "à compléter"}. Style : ${data.style}. ${data.extra}
Sections : en-tête avec accroche, services, à propos, avis clients, horaires et contact avec bouton d'appel. Texte en français, convaincant, adapté au métier.`;
    const raw = await chat(
      "Tu es un développeur web expert. Réponds UNIQUEMENT avec un document HTML complet (<!doctype html>...) utilisant Tailwind via <script src=\"https://cdn.tailwindcss.com\"></script>, responsive, élégant, avec des images d'Unsplash (https://images.unsplash.com/...) pertinentes. Aucun texte hors du HTML, pas de balises markdown.",
      prompt,
    );
    const html = raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
    return { html, prompt };
  });

export const generateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { business: Biz; channel: string; tone: string; offer: string }) => ({
    business: { ...i.business, name: String(i.business?.name ?? "").slice(0, 120) },
    channel: String(i.channel ?? "email").slice(0, 30),
    tone: String(i.tone ?? "chaleureux").slice(0, 30),
    offer: String(i.offer ?? "").slice(0, 500),
  }))
  .handler(async ({ data }) => {
    const b = data.business;
    const text = await chat(
      "Tu es un coach commercial pour freelances qui vendent des sites web aux commerces locaux. Réponds en français, en markdown simple.",
      `Commerce : ${b.name} (${b.category ?? "commerce"}), ${b.address ?? ""}.
Canal : ${data.channel}. Ton : ${data.tone}. Offre : ${data.offer || "site vitrine professionnel + maintenance mensuelle"}.
Donne :
1. Un message de prospection prêt à envoyer (objet inclus si e-mail), court et personnalisé.
2. Une relance à J+3.
3. Un plan d'action en 4 étapes pour convertir ce prospect.
4. Les 3 objections probables et comment y répondre.`,
    );
    return { text };
  });
