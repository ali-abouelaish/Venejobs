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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors select-none
        ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
      style={{ minHeight: '72px' }}
    >
      {/* Avatar */}
      <Avatar
        id={other_id}
        name={other_name}
        src={other_avatar}
        size={40}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Line 1: name + timestamp */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {other_name}
          </span>
          <span className="text-xs text-gray-500 shrink-0">
            {formatChatTime(last_message_sent_at)}
          </span>
        </div>
        {/* Line 2: preview + unread badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-600 truncate flex-1">
            {last_message_body ?? 'No messages yet'}
          </span>
          {unread_count > 0 && !isActive && (
            <span className="bg-blue-600 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none shrink-0">
              {unread_count > 99 ? '99+' : unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
