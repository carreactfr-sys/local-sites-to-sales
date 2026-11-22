import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, MapPin, Sparkles, MessageSquareText, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/prospects", label: "Prospection", icon: MapPin },
  { to: "/sites", label: "Sites IA", icon: Sparkles },
  { to: "/assistant", label: "Assistant commercial", icon: MessageSquareText },
] as const;

export function AppShell({ children, title, subtitle, action }: { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <Link to="/dashboard" className="mb-10 font-display text-2xl font-extrabold">
          Scale<span className="text-sidebar-primary">SaaS</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm opacity-70 hover:bg-sidebar-accent hover:opacity-100"
        >
          <LogOut className="size-4" /> Déconnexion
        </button>
      </aside>
      <div className="flex-1">
        <nav className="flex gap-1 overflow-x-auto bg-sidebar p-2 text-sidebar-foreground md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-md px-3 py-2 text-xs" activeProps={{ className: "bg-sidebar-accent font-semibold" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-6xl p-6 md:p-10">
          <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
            <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
            </div>
            {action}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
