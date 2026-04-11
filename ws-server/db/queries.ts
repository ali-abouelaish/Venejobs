import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export interface Reaction {
  emoji: string;
  count: number;
  userIds: number[];
}

export async function upsertReads(messageIds: string[], userId: number): Promise<void> {
  if (messageIds.length === 0) return;
  // Insert each read record, ignoring conflicts
  for (const messageId of messageIds) {
    await sql`
      INSERT INTO message_reads (message_id, user_id)
      VALUES (${messageId}::uuid, ${userId})
      ON CONFLICT (message_id, user_id) DO NOTHING
    `;
  }
}

export async function getReactions(messageId: string): Promise<Reaction[]> {
  const rows = await sql<{ emoji: string; user_ids: number[]; cnt: number }[]>`
    SELECT
      emoji,
      COUNT(*)::int     AS cnt,
      array_agg(user_id) AS user_ids
    FROM message_reactions
    WHERE message_id = ${messageId}::uuid
    GROUP BY emoji
  `;
  return rows.map((r) => ({
    emoji: r.emoji,
    count: r.cnt,
    userIds: r.user_ids,
  }));
}

export async function addReaction(
  messageId: string,
  userId: number,
  emoji: string,
): Promise<void> {
  await sql`
    INSERT INTO message_reactions (message_id, user_id, emoji)
    VALUES (${messageId}::uuid, ${userId}, ${emoji})
    ON CONFLICT (message_id, user_id, emoji) DO NOTHING
  `;
}

export async function removeReaction(
  messageId: string,
  userId: number,
  emoji: string,
): Promise<void> {
  await sql`
    DELETE FROM message_reactions
    WHERE message_id = ${messageId}::uuid
      AND user_id    = ${userId}
      AND emoji      = ${emoji}
  `;
}
