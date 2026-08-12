import type { VercelRequest, VercelResponse } from "@vercel/node";
import { tasks } from "@trigger.dev/sdk";
import type { submitSignupTask, SubmitSignupPayload } from "../src/trigger/submit-signup.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const payload = req.body as SubmitSignupPayload;

  try {
    const handle = await tasks.trigger<typeof submitSignupTask>("submit-signup", payload);
    res.status(200).json({ ok: true, runId: handle.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ ok: false, error: message });
  }
}
