import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runs } from "@trigger.dev/sdk";
import type { chatMessageTask } from "../src/trigger/chat-message.js";

/**
 * The browser can't read run status directly from Trigger.dev's Management
 * API with a public token (that endpoint only accepts secret keys — public
 * tokens are only usable through the React Realtime hooks, which this plain
 * static site doesn't use). So the widget polls this endpoint instead, and
 * this checks the run server-side with the secret key.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const runId = req.query.runId;
  if (typeof runId !== "string") {
    res.status(400).json({ error: "runId is required" });
    return;
  }

  try {
    const run = await runs.retrieve<typeof chatMessageTask>(runId);

    if (run.status === "COMPLETED") {
      res.status(200).json({ ok: true, done: true, output: run.output });
      return;
    }
    if (["FAILED", "CRASHED", "SYSTEM_FAILURE", "CANCELED", "INTERRUPTED"].includes(run.status)) {
      res.status(200).json({ ok: true, done: true, output: { status: "timed_out" } });
      return;
    }
    res.status(200).json({ ok: true, done: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ ok: false, error: message });
  }
}
