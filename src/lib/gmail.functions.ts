import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://connector-gateway.lovable.dev";
const CONNECTOR = "google_mail";
const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.send",
];

export const startGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { authorizeAppUserOAuth } = await import("@/integrations/lovable/appUserConnector");
    const clientKey = process.env['GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY'];
    if (!clientKey) throw new Error("La connexion Gmail n'est pas configurée.");
    const request = getRequest();
    const url = new URL(request.url);
    const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL("/api/oauth/google_mail/return", sandboxHost ? `https://${sandboxHost}` : url.origin).toString();
    const { authorizationUrl } = await authorizeAppUserOAuth({ gatewayBaseUrl: GATEWAY, connectorId: CONNECTOR, appUserId: context.userId, clientAPIKey: clientKey, returnUrl, credentialsConfiguration: { scopes: SCOPES } });
    return { authorizationUrl };
  });

export const completeGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => { if (typeof d?.code !== "string" || !d.code) throw new Error("Code manquant"); return d; })
  .handler(async ({ data, context }) => {
    const { exchangeAppUserOAuthCode } = await import("@/integrations/lovable/appUserConnector");
    const { saveConnectionKeyForUser } = await import("@/lib/appUserConnections.server");
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY, data.code);
    if (connectorId !== CONNECTOR) throw new Error("Mauvais connecteur");
    await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);
    return { ok: true };
  });

export const getGmailStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { callAsAppUser, appUserReconnectRequired } = await import("@/integrations/lovable/appUserConnector");
    const { getConnectionKeyForUser } = await import("@/lib/appUserConnections.server");
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR);
    if (!key) return { connected: false as const, reconnectRequired: false, email: null as string | null };
    const res = await callAsAppUser({ gatewayBaseUrl: GATEWAY, connectionAPIKey: key, connectorId: CONNECTOR, path: "/gmail/v1/users/me/profile", requiredScopes: SCOPES });
    if (await appUserReconnectRequired(res)) return { connected: false as const, reconnectRequired: true, email: null };
    if (!res.ok) { const t = await res.text(); console.error(`Gmail profile [${res.status}]: ${t}`); throw new Error(`Gmail indisponible (${res.status})`); }
    const p = (await res.json()) as { emailAddress?: string };
    return { connected: true as const, reconnectRequired: false, email: p.emailAddress ?? null };
  });

export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
    const { getConnectionKeyForUser, deleteConnectionForUser } = await import("@/lib/appUserConnections.server");
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR);
    if (key) await disconnectAppUser({ gatewayBaseUrl: GATEWAY, connectionAPIKey: key, connectorId: CONNECTOR });
    await deleteConnectionForUser(context.userId, CONNECTOR);
    return { ok: true };
  });

const b64 = (s: string) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const header = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

export const sendGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { to: string; subject: string; body: string }) => {
    if (!/^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/.test(d?.to ?? "")) throw new Error("Adresse e-mail invalide");
    if (!d.subject?.trim() || d.subject.length > 300 || /[\r\n]/.test(d.subject)) throw new Error("Objet invalide");
    if (!d.body?.trim() || d.body.length > 20000) throw new Error("Message invalide");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { callAsAppUser, appUserReconnectRequired } = await import("@/integrations/lovable/appUserConnector");
    const { getConnectionKeyForUser } = await import("@/lib/appUserConnections.server");
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR);
    if (!key) throw new Error("Connecte d'abord ton Gmail.");
    const raw = b64([`To: ${data.to}`, `Subject: ${header(data.subject)}`, "MIME-Version: 1.0", 'Content-Type: text/plain; charset="UTF-8"', "", data.body].join("\r\n")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const res = await callAsAppUser({ gatewayBaseUrl: GATEWAY, connectionAPIKey: key, connectorId: CONNECTOR, path: "/gmail/v1/users/me/messages/send", requiredScopes: SCOPES, init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raw }) } });
    if (await appUserReconnectRequired(res)) throw new Error("Ton accès Gmail doit être renouvelé : reconnecte Gmail.");
    if (!res.ok) { const t = await res.text(); console.error(`Gmail send [${res.status}]: ${t}`); throw new Error(`Envoi impossible (${res.status})`); }
    return { ok: true };
  });
