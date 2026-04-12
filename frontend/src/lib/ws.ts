export async function broadcastToWs(
  conversationId: string,
  payload: unknown,
): Promise<void> {
  const url = process.env.WS_INTERNAL_URL ?? "http://localhost:4001";
  const secret = process.env.WS_INTERNAL_SECRET;
  if (!secret) {
    console.warn("[ws] WS_INTERNAL_SECRET not set, skipping broadcast");
    return;
  }
  try {
    await fetch(`${url}/internal/broadcast`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": secret,
      },
      body: JSON.stringify({ conversationId, payload }),
    });
  } catch (err) {
    console.error("[ws] broadcast failed", err);
  }
}
