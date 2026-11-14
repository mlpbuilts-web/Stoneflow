// /api/me: who is this visitor (editor / viewer / not signed in), and is OneDrive connected?
import { json, caller, kvGet, env } from "../lib/common.mjs";

export default async (req) => {
  const u = await caller(req).catch(() => null);
  const owner = await kvGet("owner").catch(() => null);
  // Admins see the "things to check in the sheet" notes: ADMIN_EMAILS, or the owner when it isn't set.
  const admins = (env("ADMIN_EMAILS") || env("OWNER_EMAIL")).toLowerCase().split(/[\s,;]+/).filter(Boolean);
  return json({ signedIn: !!u, name: u?.name || "", email: u?.email || "", role: u?.role || "viewer", isOwner: !!u?.owner,
    isAdmin: !!u && (u.emails || []).some((e) => admins.includes(e)), connected: !!owner?.refresh_token,
    clientId: env("MS_CLIENT_ID"), tenant: env("MS_TENANT", "consumers") });
};

export const config = { path: "/api/me" };
