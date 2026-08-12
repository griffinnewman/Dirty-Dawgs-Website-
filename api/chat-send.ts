import type { VercelRequest, VercelResponse } from "@vercel/node";
import { tasks, auth } from "@trigger.dev/sdk";
import type { chatMessageTask, ChatMessagePayload } from "../src/trigger/chat-message.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const body = req.body as ChatMessagePayload;

  if (!body.sessionId || !body.message) {
    res.status(400).json({ error: "sessionId and message are required" });
    return;
  }

  try {
    const handle = await tasks.trigger<typeof chatMessageTask>("chat-message", body);
    const publicAccessToken = await auth.createPublicToken({
      scopes: { read: { runs: [handle.id] } },
      expirationTime: `${(body.timeoutMinutes ?? 45) + 5}m`,
    });

    res.status(200).json({ ok: true, runId: handle.id, publicAccessToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ ok: false, error: message });
  }
}
