import { prisma } from "../../DB/prisma";
import { config } from "../../config/config";

type CreateMessagePayload = {
  name: string;
  email: string;
  message: string;
};

/**
 * Fires the n8n webhook so the workflow can send a reply email.
 * Deliberately swallows errors: n8n being down shouldn't fail the
 * user's request — the message is already safely stored in the DB.
 */
const forwardToN8n = async (payload: CreateMessagePayload & { id: string }) => {
  console.log(payload)
  if (!config.n8n_contact_webhook_url) {
    console.warn("N8N_CONTACT_WEBHOOK_URL is not set — skipping n8n forward.");
    return;
  }

  try {
    const res = await fetch(config.n8n_contact_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: payload.id,
        name: payload.name,
        email: payload.email,
        message: payload.message,
        source: "bloodflow-contact-page",
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.error(
        "n8n webhook responded with",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (err) {
    console.error("Failed to reach n8n webhook:", err);
  }
};

const createMessage = async (payload: CreateMessagePayload) => {
  const result = await prisma.contactMessage.create({
    data: payload,
  });

  // Don't block the API response on n8n's availability/latency.
  void forwardToN8n({ ...payload, id: result.id });

  return result;
};

const getAllMessages = async () => {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const contactServices = { createMessage, getAllMessages };
