'use client';
import { Search } from 'lucide-react';
import type { Conversation } from './types';
import ChatItem from './ChatItem';
import { ChatListSkeleton } from './LoadingSkeleton';

type Props = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function ChatList({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  setSearchQuery,
  isLoading,
  error,
  onRetry,
}: Props) {
  const filtered = conversations.filter((c) =>
    (c.other_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 shrink-0">
        <span className="text-[15px] font-medium text-msg-text">Chats</span>
        {conversations.length > 0 && (
          <span className="text-[11px] font-medium text-msg-text-tertiary tabular-nums">
            {conversations.length}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pb-3 shrink-0">
        <div className="relative flex items-center">
          <Search
            size={14}
            className="absolute left-3 text-msg-text-tertiary pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-msg-surface msg-border rounded-lg pl-9 pr-3 text-[13px] text-msg-text placeholder:text-msg-text-tertiary outline-none focus:border-msg-brand transition-colors duration-150"
            style={{ height: '36px' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto msg-scroll px-2 pb-2 flex flex-col gap-0.5">
        {isLoading ? (
          <ChatListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <p className="text-[13px] text-msg-text-secondary text-center">
              Failed to load. Try again.
            </p>
            <button
              onClick={onRetry}
              className="text-[13px] text-msg-brand font-medium hover:text-msg-brand-hover transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-msg-text-secondary text-center py-10">
            No conversations found.
          </p>
        ) : (
          filtered.map((conv) => (
            <ChatItem
              key={conv.conversation_id}
              conversation={conv}
              isActive={selectedId === conv.conversation_id}
              onClick={() => onSelect(conv)}
            />
          ))
        )}
      </div>
    </div>
  );
}
