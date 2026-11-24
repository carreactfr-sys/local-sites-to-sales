import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SupportDesk } from "@/components/SupportDesk";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Support — ScaleSaaS" }, { name: "description", content: "Contacte l'équipe ScaleSaaS et suis tes demandes." }, { property: "og:title", content: "Support ScaleSaaS" }, { property: "og:description", content: "Pose ta question, on te répond dans ton compte." }] }),
  component: () => (
    <AppShell title="Support" subtitle="Pose ta question, la réponse arrive ici dans ton compte.">
      <SupportDesk />
    </AppShell>
  ),
});
