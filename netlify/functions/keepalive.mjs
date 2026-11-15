// Runs once a day on Netlify's schedule. It renews the owner's OneDrive sign-in so the connection
// never sits unused long enough for Microsoft to expire it (about 90 days without use).
import { ownerToken } from "../lib/common.mjs";

export default async () => {
  try { await ownerToken(); console.log("OneDrive connection renewed"); }
  catch (e) { console.error("OneDrive keep-alive failed:", e.message); }
  return new Response("ok");
};

export const config = { schedule: "@daily" };
