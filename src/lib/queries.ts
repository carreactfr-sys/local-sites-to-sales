import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const STATUSES = ["nouveau", "contacté", "en discussion", "signé", "perdu"] as const;

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user!.id).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const prospectsQuery = queryOptions({
  queryKey: ["prospects"],
  queryFn: async () => {
    const { data, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const sitesQuery = queryOptions({
  queryKey: ["sites"],
  queryFn: async () => {
    const { data, error } = await supabase.from("sites").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const planQuery = queryOptions({
  queryKey: ["plan"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.rpc("current_plan", { _user_id: u.user!.id });
    const { data: admin } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
    const { asPlan } = await import("./plans");
    return { plan: asPlan(data as string), isAdmin: admin === true };
  },
});
