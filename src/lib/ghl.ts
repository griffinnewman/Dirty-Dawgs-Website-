/**
 * Thin wrapper around the GoHighLevel (GHL) API v2.
 *
 * Requires env vars:
 *   GHL_PRIVATE_INTEGRATION_TOKEN — Settings > Private Integrations in GHL
 *   GHL_LOCATION_ID               — Settings > Business Info in GHL
 */

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const CONTACTS_VERSION = "2021-07-28";
const CONVERSATIONS_VERSION = "2021-04-15";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function authHeaders(version: string) {
  return {
    Authorization: `Bearer ${requireEnv("GHL_PRIVATE_INTEGRATION_TOKEN")}`,
    Version: version,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Creates the contact if it doesn't exist (matched by phone/email), otherwise updates it. */
export async function upsertContact(input: {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  tags?: string[];
}): Promise<{ id: string }> {
  const res = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
    method: "POST",
    headers: authHeaders(CONTACTS_VERSION),
    body: JSON.stringify({
      locationId: requireEnv("GHL_LOCATION_ID"),
      ...input,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GHL upsertContact failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { contact: { id: string } };
  return { id: data.contact.id };
}

export async function sendSms(contactId: string, message: string): Promise<void> {
  const res = await fetch(`${GHL_API_BASE}/conversations/messages`, {
    method: "POST",
    headers: authHeaders(CONVERSATIONS_VERSION),
    body: JSON.stringify({ type: "SMS", contactId, message }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GHL sendSms failed: ${res.status} ${body}`);
  }
}
