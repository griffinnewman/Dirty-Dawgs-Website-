import { task, wait, logger } from "@trigger.dev/sdk";
import { upsertContact, sendSms } from "../lib/ghl.js";

export const CHAT_WAITPOINT_TAG = "website-chat";

export interface ChatMessagePayload {
  sessionId: string;
  message: string;
  page?: string;
  timeoutMinutes?: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// SMS providers silently fail to deliver messages well past a normal chat
// length (thousands of characters), so cap what actually gets embedded in
// the outbound text regardless of what the client sent.
const MAX_MESSAGE_LENGTH = 500;

export const chatMessageTask = task({
  id: "chat-message",
  run: async (payload: ChatMessagePayload) => {
    const ownerPhone = requireEnv("GHL_OWNER_PHONE");
    const owner = await upsertContact({ phone: ownerPhone, tags: ["dirty-dawgs-owner"] });

    const message =
      payload.message.length > MAX_MESSAGE_LENGTH
        ? payload.message.slice(0, MAX_MESSAGE_LENGTH) + "…"
        : payload.message;
    const pageLine = payload.page ? `\nOn: ${payload.page}` : "";

    const timeoutMinutes = payload.timeoutMinutes ?? 45;
    const token = await wait.createToken({
      timeout: `${timeoutMinutes}m`,
      tags: [CHAT_WAITPOINT_TAG],
    });

    await sendSms(
      owner.id,
      `💬 A visitor on dogpoopsmells.com: "${message}"${pageLine}\n\nReply to this text to answer them live in the chat. (Expires in ${timeoutMinutes} min.)`
    );

    logger.info("Waiting for owner reply", { tokenId: token.id, sessionId: payload.sessionId });

    const result = await wait.forToken<{ reply: string }>(token);

    if (!result.ok) {
      return { status: "timed_out" as const };
    }
    return { status: "replied" as const, reply: result.output.reply };
  },
});
