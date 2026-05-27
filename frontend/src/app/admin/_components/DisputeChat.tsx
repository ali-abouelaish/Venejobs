'use client';

import { useCallback, useEffect, useState } from 'react';
import { Avatar, Badge, Card, EmptyState, ErrorState, Icon, Skeleton } from '../../services-ui';

interface MessageAttachment {
  id: string;
  url: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  size_bytes: number;
}

interface ConversationSummary {
  id: string;
  kind: 'direct' | 'proposal' | 'contract';
  label: string | null;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  conversation_kind: 'direct' | 'proposal' | 'contract';
  conversation_label: string | null;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  body: string | null;
  message_type: string;
  is_deleted: boolean;
  sent_at: string;
  attachments: MessageAttachment[];
}

interface ChatResponse {
  messages: ChatMessage[];
  conversations: ConversationSummary[];
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tagText(kind: ChatMessage['conversation_kind'], label: string | null): string {
  if (kind === 'direct') return 'Direct chat';
  if (kind === 'contract') return label ? `Contract · ${label}` : 'Contract chat';
  return label ? `Proposal · ${label}` : 'Proposal chat';
}

export function DisputeChat({ endpoint }: { endpoint: string }) {
  const [data, setData] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Failed to load chat');
      setData(json as ChatResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <Card padding={16}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Skeleton width={32} height={32} radius={16} />
            <div style={{ flex: 1 }}>
              <Skeleton width="40%" height={12} style={{ marginBottom: 6 }} />
              <Skeleton width="80%" height={14} />
            </div>
          </div>
        ))}
      </Card>
    );
  }

  if (error) {
    return <ErrorState title="Could not load chat" body={error} onRetry={load} />;
  }

  if (!data || data.messages.length === 0) {
    return (
      <EmptyState
        icon="info"
        title="No messages yet"
        body="There are no messages between these parties to display."
      />
    );
  }

  return (
    <Card padding={0}>
      <div
        style={{
          maxHeight: 560,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {data.messages.map((msg) => (
          <MessageRow key={msg.id} msg={msg} multipleThreads={data.conversations.length > 1} />
        ))}
      </div>
    </Card>
  );
}

function MessageRow({ msg, multipleThreads }: { msg: ChatMessage; multipleThreads: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: 12,
        borderRadius: 8,
        background: 'var(--surface-2)',
        border: '1px solid var(--border-2)',
      }}
    >
      <Avatar name={msg.sender_name} src={msg.sender_avatar ?? undefined} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>
            {msg.sender_name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>
            {formatTimestamp(msg.sent_at)}
          </span>
          {multipleThreads && (
            <Badge tone="info" size="sm">
              {tagText(msg.conversation_kind, msg.conversation_label)}
            </Badge>
          )}
        </div>
        {msg.is_deleted ? (
          <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--fg-4)' }}>
            Message deleted
          </div>
        ) : (
          <>
            {msg.body && (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--fg-2)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.body}
              </div>
            )}
            {msg.message_type === 'contract' && (
              <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 4, fontStyle: 'italic' }}>
                (contract card)
              </div>
            )}
            {msg.attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {msg.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={`/api/download?url=${encodeURIComponent(a.url)}&name=${encodeURIComponent(a.file_name)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: '#fff',
                      border: '1px solid var(--border-2)',
                      fontSize: 12,
                      color: 'var(--fg-2)',
                      textDecoration: 'none',
                    }}
                  >
                    <Icon name="download" size={14} />
                    <span>{a.file_name}</span>
                    <span style={{ color: 'var(--fg-4)' }}>
                      ({Math.round(a.size_bytes / 1024)} KB)
                    </span>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
