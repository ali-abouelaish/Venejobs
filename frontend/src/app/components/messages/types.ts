export type Conversation = {
  conversation_id: string;
  proposal_id: number;
  proposal_status: string;
  offered_price: number | null;
  job_title: string;
  other_id: number;
  other_name: string;
  other_avatar: string | null;
  last_message_body: string | null;
  last_message_sent_at: string | null;
  unread_count: number;
};

export interface InboxRow {
  conversation_id: string;
  proposal_id: number;
  proposal_status: string;
  offered_price: number | null;
  job_title: string;
  other_participant: { id: number; name: string; avatar: string | null };
  last_message: { body: string | null; sent_at: string; sender_id: number } | null;
  unread_count: number;
}

export function normalizeInboxRow(row: InboxRow): Conversation {
  return {
    conversation_id: row.conversation_id,
    proposal_id: row.proposal_id,
    proposal_status: row.proposal_status,
    offered_price: row.offered_price,
    job_title: row.job_title,
    other_id: row.other_participant?.id ?? 0,
    other_name: row.other_participant?.name ?? '',
    other_avatar: row.other_participant?.avatar ?? null,
    last_message_body: row.last_message?.body ?? null,
    last_message_sent_at: row.last_message?.sent_at ?? null,
    unread_count: row.unread_count ?? 0,
  };
}

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string | number;
  body: string;
  sent_at: string;
  read_at: string | null;
  sender_name?: string;
  sender_avatar?: string | null;
};
