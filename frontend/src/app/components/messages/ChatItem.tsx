'use client';
import type { Conversation } from './types';
import { formatChatTime } from './utils';
import Avatar from '@/app/components/Avatar';

type Props = {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
};

export default function ChatItem({ conversation, isActive, onClick }: Props) {
  const { other_id, other_name, other_avatar, last_message_body, last_message_sent_at, unread_count } =
    conversation;
  const isUnread = unread_count > 0 && !isActive;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
      className={`relative flex items-start gap-3 px-2.5 py-2 rounded-lg cursor-pointer select-none transition-colors duration-150
        ${isActive
          ? 'bg-msg-surface msg-border'
          : 'hover:bg-msg-hover'}`}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute -left-0.75 top-2 bottom-2 w-0.75 rounded-full bg-msg-rail"
        />
      )}

      <Avatar id={other_id} name={other_name} src={other_avatar} size={28} />

      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-[13px] font-medium text-msg-text truncate leading-tight">
          {other_name}
        </span>
        <span
          className={`text-[11px] truncate leading-snug mt-0.5 ${
            isUnread ? 'font-medium text-msg-text' : 'text-msg-text-secondary'
          }`}
        >
          {last_message_body ?? 'No messages yet'}
        </span>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
        <span className="text-[10px] text-msg-text-tertiary tabular-nums">
          {formatChatTime(last_message_sent_at)}
        </span>
        {isUnread && (
          <span
            aria-hidden
            className="w-1.5 h-1.5 rounded-full bg-msg-brand"
          />
        )}
      </div>
    </div>
  );
}
