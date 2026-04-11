import 'dotenv/config';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { upsertReads, getReactions, addReaction, removeReaction } from './db/queries';

const WS_PORT = parseInt(process.env.WS_PORT ?? '4002', 10);
const WS_INTERNAL_PORT = parseInt(process.env.WS_INTERNAL_PORT ?? '4001', 10);
const WS_SECRET = process.env.WS_SECRET!;
const WS_INTERNAL_SECRET = process.env.WS_INTERNAL_SECRET!;

if (!WS_SECRET) throw new Error('WS_SECRET env var is required');
if (!WS_INTERNAL_SECRET) throw new Error('WS_INTERNAL_SECRET env var is required');

// ─── Connection state ─────────────────────────────────────────────────────────

interface Connection {
  ws: WebSocket;
  userId: number;
  conversationId: string;
}

/** conversationId → set of open connections */
const rooms = new Map<string, Set<Connection>>();

function join(conn: Connection): void {
  if (!rooms.has(conn.conversationId)) rooms.set(conn.conversationId, new Set());
  rooms.get(conn.conversationId)!.add(conn);
}

function leave(conn: Connection): void {
  const room = rooms.get(conn.conversationId);
  if (!room) return;
  room.delete(conn);
  if (room.size === 0) rooms.delete(conn.conversationId);
}

function send(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

/** Broadcast to all connections in a conversation, optionally excluding one. */
function broadcast(
  conversationId: string,
  payload: unknown,
  exclude?: Connection,
): void {
  const room = rooms.get(conversationId);
  if (!room) return;
  for (const conn of room) {
    if (conn !== exclude) send(conn.ws, payload);
  }
}

/** Broadcast to ALL connections in a conversation, including sender. */
function broadcastAll(conversationId: string, payload: unknown): void {
  broadcast(conversationId, payload);
}

// ─── WebSocket server ─────────────────────────────────────────────────────────

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const token = url.searchParams.get('token');
  const conversationId = url.searchParams.get('conversationId');

  if (!token || !conversationId) {
    ws.close(4001, 'Missing token or conversationId');
    return;
  }

  let userId: number;
  try {
    const decoded = jwt.verify(token, WS_SECRET) as {
      userId: number;
      conversationId: string;
    };
    if (decoded.conversationId !== conversationId) {
      throw new Error('conversationId mismatch');
    }
    userId = decoded.userId;
  } catch {
    ws.close(4001, 'Invalid or expired token');
    return;
  }

  const conn: Connection = { ws, userId, conversationId };
  join(conn);

  ws.on('message', async (raw) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString()) as Record<string, unknown>;
    } catch {
      return;
    }

    try {
      switch (msg.type) {
        case 'ping':
          send(ws, { type: 'pong' });
          break;

        case 'typing_start':
          broadcast(conversationId, { type: 'typing', userId, conversationId }, conn);
          break;

        case 'typing_stop':
          broadcast(conversationId, { type: 'typing_stop', userId, conversationId }, conn);
          break;

        case 'mark_read': {
          const messageIds = msg.messageIds as string[] | undefined;
          if (!Array.isArray(messageIds) || messageIds.length === 0) break;
          await upsertReads(messageIds, userId);
          broadcastAll(conversationId, {
            type: 'read_receipt',
            messageIds,
            userId,
            conversationId,
          });
          break;
        }

        case 'reaction_add': {
          const messageId = msg.messageId as string;
          const emoji = msg.emoji as string;
          if (!messageId || !emoji) break;
          await addReaction(messageId, userId, emoji);
          const reactions = await getReactions(messageId);
          broadcastAll(conversationId, { type: 'reaction_update', messageId, reactions });
          break;
        }

        case 'reaction_remove': {
          const messageId = msg.messageId as string;
          const emoji = msg.emoji as string;
          if (!messageId || !emoji) break;
          await removeReaction(messageId, userId, emoji);
          const reactions = await getReactions(messageId);
          broadcastAll(conversationId, { type: 'reaction_update', messageId, reactions });
          break;
        }
      }
    } catch (err) {
      console.error('[ws message handler]', err);
    }
  });

  ws.on('close', () => leave(conn));
  ws.on('error', (err) => console.error('[ws error]', err));
});

// ─── Public WebSocket HTTP server ─────────────────────────────────────────────

const wsHttpServer = http.createServer((_req, res) => {
  res.writeHead(426, { 'Content-Type': 'text/plain' });
  res.end('Upgrade required');
});

wsHttpServer.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wsHttpServer.listen(WS_PORT, () => {
  console.log(`[ws-server] WebSocket listening on port ${WS_PORT}`);
});

// ─── Internal broadcast HTTP server ──────────────────────────────────────────

const internalServer = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/internal/broadcast') {
    res.writeHead(404).end();
    return;
  }

  if (req.headers['x-internal-secret'] !== WS_INTERNAL_SECRET) {
    res.writeHead(401).end('Unauthorized');
    return;
  }

  let body = '';
  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
    if (body.length > 1_048_576) {
      // 1 MB guard
      res.writeHead(413).end();
      req.destroy();
    }
  });

  req.on('end', () => {
    try {
      const { conversationId, payload } = JSON.parse(body) as {
        conversationId: string;
        payload: unknown;
      };
      if (!conversationId || payload === undefined) {
        res.writeHead(400).end('Missing conversationId or payload');
        return;
      }
      broadcastAll(conversationId, payload);
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({ ok: true }),
      );
    } catch (err) {
      console.error('[internal broadcast]', err);
      res.writeHead(400).end('Invalid JSON');
    }
  });
});

internalServer.listen(WS_INTERNAL_PORT, () => {
  console.log(`[ws-server] Internal broadcast listening on port ${WS_INTERNAL_PORT}`);
});
