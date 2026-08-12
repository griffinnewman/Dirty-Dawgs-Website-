import type { VercelRequest, VercelResponse } from "@vercel/node";
import { wait } from "@trigger.dev/sdk";
import { CHAT_WAITPOINT_TAG } from "../src/trigger/chat-message.js";

/**
 * Configure this URL as a GHL Workflow "Webhook" action, triggered when the
 * owner's own contact replies by SMS (Workflow trigger: Customer Replied,
 * scoped to the owner's contact / "dirty-dawgs-owner" tag). See SETUP.md.
 *
 * There's no way to know which chat session a plain SMS reply belongs to, so
 * this completes the most recently created still-open website-chat waitpoint
 * (tokens are listed newest first). If two visitors are chatting at the same
 * time, a reply goes to whichever chat started most recently until that one
 * is answered.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const sharedSecret = process.env.GHL_WEBHOOK_SHARED_SECRET;
  if (!sharedSecret || req.query.secret !== sharedSecret) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const body = req.body as { message?: string; customData?: { message?: string } };
  const reply = body.customData?.message || body.message;
  if (!reply) {
    res.status(400).json({ error: "missing message body" });
    return;
  }

  const openTokens = await wait.listTokens({ status: "WAITING", tags: [CHAT_WAITPOINT_TAG] });

  let completed = false;
  for await (const token of openTokens) {
    await wait.completeToken(token.id, { reply });
    completed = true;
    break;
  }

  res.status(200).json({ ok: true, delivered: completed });
}
