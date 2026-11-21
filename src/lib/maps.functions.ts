import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlaceResult = {
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  category: string | null;
  rating: number | null;
  lat: number | null;
  lng: number | null;
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export const searchBusinesses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string; city: string }) => {
    const query = String(input.query ?? "").trim().slice(0, 80);
    const city = String(input.city ?? "").trim().slice(0, 80);
    if (!query || !city) throw new Error("Secteur et ville requis");
    return { query, city };
  })
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) throw new Error("Connexion Google Maps manquante");
    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.nationalPhoneNumber,places.rating,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({ textQuery: `${data.query} à ${data.city}`, pageSize: 20, languageCode: "fr" }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Places failed [${res.status}]: ${body}`);
      throw new Error(`Recherche impossible [${res.status}]`);
    }
    const json = (await res.json()) as { places?: Array<Record<string, any>> };
    const results: PlaceResult[] = (json.places ?? []).map((p) => ({
      place_id: p["id"],
      name: p["displayName"]?.text ?? "Sans nom",
      address: p["formattedAddress"] ?? null,
      phone: p["nationalPhoneNumber"] ?? null,
      website: p["websiteUri"] ?? null,
      category: p["primaryTypeDisplayName"]?.text ?? null,
      rating: p["rating"] ?? null,
      lat: p["location"]?.latitude ?? null,
      lng: p["location"]?.longitude ?? null,
    }));
    return results;
  });
