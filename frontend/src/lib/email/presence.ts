/**
 * Bridge to the ws-server's `/internal/presence` endpoint. Returns true
 * if the user has at least one open WebSocket connection on ws-server.
 *
 * On any error (ws-server down, timeout, missing secret) returns true
 * — the safer default. "Online unless proven offline" prevents an
 * outage from converting every chat message into an email storm. The
 * tradeoff: if ws-server is genuinely down, recipients won't get the
 * fallback email either. Since real-time chat is broken in that case
 * anyway, the user-visible product is degraded regardless.
 */
export async function isUserOnline(userId: number): Promise<boolean> {
  const url = process.env.WS_INTERNAL_URL ?? 'http://localhost:4001';
  const secret = process.env.WS_INTERNAL_SECRET;
  if (!secret) {
    console.warn('[presence] WS_INTERNAL_SECRET not set — assuming online');
    return true;
  }

  // 1.5s cap so a hung ws-server doesn't stall the chat POST response.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch(
      `${url}/internal/presence?userId=${encodeURIComponent(String(userId))}`,
      {
        method: 'GET',
        headers: { 'x-internal-secret': secret },
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      console.warn(`[presence] ws-server returned ${res.status} — assuming online`);
      return true;
    }
    const data = (await res.json()) as { online?: unknown };
    return data.online === true;
  } catch (err) {
    console.warn('[presence] ws-server unreachable — assuming online:', err);
    return true;
  } finally {
    clearTimeout(timer);
  }
}
