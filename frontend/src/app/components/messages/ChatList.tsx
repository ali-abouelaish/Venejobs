'use client';
import { Search, MoreHorizontal } from 'lucide-react';
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
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-sm font-semibold text-gray-700">Chats</span>
        <MoreHorizontal size={16} className="text-gray-500 cursor-pointer hover:text-gray-700" />
      </div>

      {/* Search */}
      <div className="px-4 pb-3 shrink-0">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-gray-50 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none border-0 focus:ring-1 focus:ring-gray-300"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <ChatListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <p className="text-sm text-gray-500 text-center">Failed to load. Try again.</p>
            <button
              onClick={onRetry}
              className="text-sm text-blue-600 font-semibold hover:underline"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">No conversations found.</p>
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
