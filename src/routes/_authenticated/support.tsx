import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SupportDesk } from "@/components/SupportDesk";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Support — Lead SaaS" }, { name: "description", content: "Contacte l'équipe Lead SaaS et suis tes demandes." }, { property: "og:title", content: "Support Lead SaaS" }, { property: "og:description", content: "Pose ta question, on te répond dans ton compte." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <AppShell title="Support" subtitle="Pose ta question, la réponse arrive ici dans ton compte.">
      <SupportDesk />
    </AppShell>
  ),
});
