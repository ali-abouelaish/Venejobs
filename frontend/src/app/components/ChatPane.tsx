'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { Send, Paperclip, X, Download, Reply, Trash2, Smile, FileText, File } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  useMessages,
  type Message,
  type AttachmentInput,
  type WsIncoming,
} from '@/app/hooks/useMessages';
import Avatar from '@/app/components/Avatar';
import ContractCard from '@/app/components/ContractCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  conversationId: string;
  currentUserId: number;
  currentUserName?: string;
  onOpenContract?: (contractId: string) => void;
  onWsEvent?: (event: WsIncoming) => void;
  onWsConnectedChange?: (connected: boolean) => void;
}

interface PendingAttachment extends AttachmentInput {
  tempId: string;
  previewUrl?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_EMOJI = [
  '\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F525}', '\u{1F44F}', '\u{1F389}',
  '\u{1F914}', '\u{1F60D}', '\u{1F621}', '\u{1F4AF}', '\u{2705}', '\u{1F64F}', '\u{1F60E}', '\u{1F973}',
  '\u{1F440}', '\u{1F91D}', '\u{1F4AA}', '\u{1F38A}',
];

const GROUP_GAP_MS = 5 * 60 * 1000; // 5 minutes

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatDateDivider(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - target.getTime();
  const oneDay = 86400000;

  if (diff < oneDay) return 'Today';
  if (diff < 2 * oneDay) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
}

/** Check if two consecutive messages belong to the same visual group */
function isSameGroup(prev: Message, curr: Message): boolean {
  if (prev.sender_id !== curr.sender_id) return false;
  const gap = new Date(curr.sent_at).getTime() - new Date(prev.sent_at).getTime();
  return gap < GROUP_GAP_MS;
}

// ─── EmojiPicker ─────────────────────────────────────────────────────────────

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-8 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2"
      style={{ width: '168px' }}
    >
      <div className="grid grid-cols-5 gap-1">
        {COMMON_EMOJI.map((e) => (
          <button
            key={e}
            onClick={() => {
              onSelect(e);
              onClose();
            }}
            className="text-lg hover:bg-gray-100 rounded p-0.5 transition-colors"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── AttachmentView ───────────────────────────────────────────────────────────

function AttachmentView({
  att,
}: {
  att: { url: string; file_name: string; file_type: string; size_bytes: number };
}) {
  if (att.file_type === 'image') {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img
          src={att.url}
          alt={att.file_name}
          className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxWidth: '240px', maxHeight: '240px' }}
        />
        <span className="text-xs text-gray-500 mt-1 block">{att.file_name}</span>
      </a>
    );
  }
  const downloadHref = `/api/download?url=${encodeURIComponent(att.url)}&name=${encodeURIComponent(att.file_name)}`;
  return (
    <a
      href={downloadHref}
      download={att.file_name}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5 mt-2 hover:bg-gray-50 transition-colors"
      style={{ maxWidth: '280px' }}
    >
      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
        <FileText size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{att.file_name}</p>
        <p className="text-xs text-gray-500">{formatBytes(att.size_bytes)}</p>
      </div>
      <Download size={14} className="shrink-0 text-gray-400" />
    </a>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isOwn,
  currentUserId,
  showAvatar,
  showTimestamp,
  onReply,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  observeRef,
}: {
  message: Message;
  isOwn: boolean;
  currentUserId: number;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply: (m: Message) => void;
  onDelete: (id: string) => void;
  onAddReaction: (msgId: string, emoji: string) => void;
  onRemoveReaction: (msgId: string, emoji: string) => void;
  observeRef: (el: HTMLDivElement | null) => void;
}) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTouchStart() {
    longPressTimer.current = setTimeout(() => setContextMenu({ x: 0, y: 0 }), 500);
  }
  function handleTouchEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }
  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  // Soft-deleted message
  if (message.is_deleted) {
    return (
      <div
        ref={observeRef}
        data-message-id={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isOwn ? '' : showAvatar ? 'pl-0' : 'pl-10'}`}
      >
        <span className="italic text-sm text-gray-400 py-1 px-2">
          Message deleted
        </span>
      </div>
    );
  }

  const hasAttachmentsOnly = !message.body && message.attachments && message.attachments.length > 0;

  return (
    <div
      ref={observeRef}
      data-message-id={message.id}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[70%]`}>
        {/* Avatar slot (incoming only) */}
        {!isOwn && (
          <div className="w-7 shrink-0">
            {showAvatar ? (
              <Avatar
                id={message.sender_id}
                name={message.sender_name}
                src={message.sender_avatar}
                size={28}
              />
            ) : null}
          </div>
        )}

        {/* Bubble column */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} relative`}>
          {/* Reply preview */}
          {message.reply_to && (
            <div
              className="px-2.5 py-1.5 text-xs rounded-lg mb-1 border-l-2 border-blue-400 bg-gray-100 max-w-[220px]"
            >
              <p className="font-semibold text-gray-700 truncate">
                {message.reply_to.sender_name}
              </p>
              <p className="text-gray-500 truncate">
                {message.reply_to.body ?? 'Message deleted'}
              </p>
            </div>
          )}

          {/* Main bubble */}
          {!hasAttachmentsOnly && (
            <div
              className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                isOwn
                  ? 'bg-[#E8F1FF] text-[#0F2A4A] rounded-2xl rounded-br-md'
                  : 'bg-[#F1F3F5] text-gray-900 rounded-2xl rounded-bl-md'
              }`}
            >
              {message.body}
            </div>
          )}

          {/* Attachments (outside the text bubble) */}
          {message.attachments?.map((att) => <AttachmentView key={att.id} att={att} />)}

          {/* Reactions bar */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {message.reactions.map((r) => {
                const isMine = r.userIds.includes(currentUserId);
                return (
                  <button
                    key={r.emoji}
                    onClick={() =>
                      isMine
                        ? onRemoveReaction(message.id, r.emoji)
                        : onAddReaction(message.id, r.emoji)
                    }
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                      isMine
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span className="font-medium">{r.count}</span>
                  </button>
                );
              })}
              {/* + emoji button */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="flex items-center px-1.5 py-0.5 rounded-full text-xs border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Smile size={12} />
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={(emoji) => onAddReaction(message.id, emoji)}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Timestamp (only on last message of group) */}
          {showTimestamp && (
            <span className="text-[10px] text-gray-400 mt-1">
              {formatTime(message.sent_at)}
            </span>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]"
            style={
              contextMenu.x
                ? { left: contextMenu.x, top: contextMenu.y }
                : { right: '16px', bottom: '80px' }
            }
          >
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
              onClick={() => {
                onReply(message);
                setContextMenu(null);
              }}
            >
              <Reply size={14} />
              Reply
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
              onClick={() => {
                setShowEmojiPicker(true);
                setContextMenu(null);
              }}
            >
              <Smile size={14} />
              React
            </button>
            {isOwn && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  onDelete(message.id);
                  setContextMenu(null);
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ChatPane ─────────────────────────────────────────────────────────────────

export default function ChatPane({
  conversationId,
  currentUserId,
  currentUserName: _currentUserName,
  onOpenContract,
  onWsEvent,
  onWsConnectedChange,
}: Props) {
  void _currentUserName;
  const {
    messages,
    typingUsers,
    sendMessage,
    markRead,
    sendTypingStart,
    sendTypingStop,
    addReaction,
    removeReaction,
    deleteMessage,
    uploadFile,
  } = useMessages(conversationId, currentUserId, onWsEvent, onWsConnectedChange);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const observersRef = useRef<Map<string, IntersectionObserver>>(new Map());
  const pendingReadRef = useRef<Set<string>>(new Set());
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userScrolledUp.current && listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
  }

  // ── IntersectionObserver (batched read receipts) ────────────────────────────

  function flushMarkRead() {
    const ids = Array.from(pendingReadRef.current);
    pendingReadRef.current.clear();
    if (ids.length > 0) markRead(ids);
  }

  const observeMessage = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const messageId = el.dataset.messageId;
      if (!messageId) return;

      // Disconnect any prior observer on this element
      observersRef.current.get(messageId)?.disconnect();

      const message = messages.find((m) => m.id === messageId);
      if (!message || message.is_deleted) return;
      if (message.sender_id === currentUserId) return;
      if (message.read_by.includes(currentUserId)) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          pendingReadRef.current.add(messageId);
          if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
          markReadTimerRef.current = setTimeout(flushMarkRead, 300);
          obs.disconnect();
          observersRef.current.delete(messageId);
        },
        { threshold: 0.5 },
      );
      obs.observe(el);
      observersRef.current.set(messageId, obs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, currentUserId],
  );

  useEffect(() => {
    return () => {
      observersRef.current.forEach((obs) => obs.disconnect());
      observersRef.current.clear();
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, []);

  // ── Auto-resize textarea ────────────────────────────────────────────────────

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  // ── Send ─────────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && pendingAttachments.length === 0) || isSending) return;

    setIsSending(true);
    sendTypingStop();

    try {
      await sendMessage({
        body: trimmed || undefined,
        replyToId: replyTo?.id,
        attachments: pendingAttachments.map(({ url, fileName, fileType, mimeType, sizeBytes }) => ({
          url,
          fileName,
          fileType,
          mimeType,
          sizeBytes,
        })),
      });
      setText('');
      setReplyTo(null);
      setPendingAttachments((prev) => {
        prev.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
        return [];
      });
      userScrolledUp.current = false;
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [text, pendingAttachments, isSending, replyTo, sendMessage, sendTypingStop]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── File upload ─────────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20 MB`);
          continue;
        }
        const meta = await uploadFile(file, conversationId);
        const previewUrl = file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined;
        setPendingAttachments((prev) => [
          ...prev,
          { ...meta, tempId: crypto.randomUUID(), previewUrl },
        ]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function removePending(tempId: string) {
    setPendingAttachments((prev) => {
      const att = prev.find((a) => a.tempId === tempId);
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
      return prev.filter((a) => a.tempId !== tempId);
    });
  }

  // ── Contract handlers ────────────────────────────────────────────────────────

  const handleOpenContract = useCallback(
    (contractId: string) => {
      onOpenContract?.(contractId);
    },
    [onOpenContract],
  );

  // ── Build grouped message list with date dividers ───────────────────────────

  function renderMessages() {
    if (messages.length === 0) {
      return (
        <p className="text-center text-gray-400 text-sm m-auto">
          No messages yet. Say hello!
        </p>
      );
    }

    const elements: React.ReactNode[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prev = i > 0 ? messages[i - 1] : null;
      const next = i < messages.length - 1 ? messages[i + 1] : null;

      // Date divider
      if (!prev || !isSameDay(prev.sent_at, msg.sent_at)) {
        elements.push(
          <div key={`date-${i}`} className="flex justify-center my-6">
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {formatDateDivider(msg.sent_at)}
            </span>
          </div>,
        );
      }

      // Determine grouping
      const isFirstInGroup = !prev || !isSameGroup(prev, msg);
      const isLastInGroup = !next || !isSameGroup(msg, next);
      const isOwn = msg.sender_id === currentUserId;

      // Spacing between groups
      if (prev && isFirstInGroup) {
        elements.push(<div key={`gap-${i}`} className="h-3" />);
      }

      // Contract messages
      if (msg.message_type === 'contract' && msg.contract) {
        elements.push(
          <ContractCard
            key={`msg-${i}`}
            contract={msg.contract}
            onOpen={handleOpenContract}
          />,
        );
        continue;
      }

      elements.push(
        <div key={`msg-${i}`} className={isFirstInGroup ? '' : 'mt-1'}>
          <MessageBubble
            message={msg}
            isOwn={isOwn}
            currentUserId={currentUserId}
            showAvatar={!isOwn && isFirstInGroup}
            showTimestamp={isLastInGroup}
            onReply={setReplyTo}
            onDelete={deleteMessage}
            onAddReaction={addReaction}
            onRemoveReaction={removeReaction}
            observeRef={observeMessage}
          />
        </div>,
      );
    }

    return elements;
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white min-w-0 relative">
      {/* Messages list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 flex flex-col"
      >
        {renderMessages()}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-[10px] shrink-0 font-bold">
              ...
            </div>
            <div className="flex gap-1 px-3 py-2.5 bg-[#F1F3F5] rounded-2xl rounded-bl-md">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Pending attachment chips */}
      {pendingAttachments.length > 0 && (
        <div className="px-6 py-2 flex flex-wrap gap-2 border-t border-gray-200">
          {pendingAttachments.map((att) => (
            <div
              key={att.tempId}
              className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 max-w-[160px]"
            >
              {att.fileType === 'image' && att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.fileName}
                  className="w-5 h-5 rounded object-cover shrink-0"
                />
              ) : (
                <File size={12} className="shrink-0 text-gray-500" />
              )}
              <span className="truncate flex-1">{att.fileName}</span>
              <button
                onClick={() => removePending(att.tempId)}
                className="shrink-0 text-gray-400 hover:text-gray-700"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-center gap-2 px-6 py-2 bg-gray-50 border-t border-gray-200 text-xs">
          <Reply size={14} className="text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-gray-700">
              {replyTo.sender_name ?? 'User'}
            </span>
            <span className="text-gray-500 ml-1 truncate">
              {replyTo.is_deleted ? 'Message deleted' : (replyTo.body ?? '[attachment]')}
            </span>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/zip"
          onChange={handleFileChange}
        />
        <div className="flex items-end gap-2 bg-[#F3F4F6] rounded-2xl px-3 py-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach file"
            className="text-gray-500 hover:text-gray-700 shrink-0 disabled:opacity-50 p-1"
          >
            <Paperclip size={20} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              sendTypingStart();
            }}
            onKeyDown={handleKeyDown}
            onBlur={sendTypingStop}
            placeholder="Type a message..."
            className="flex-1 resize-none border-0 outline-none text-sm text-gray-900 placeholder:text-gray-500 bg-transparent py-1 leading-5 focus:ring-0"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />

          <button
            onClick={handleSend}
            disabled={(!text.trim() && pendingAttachments.length === 0) || isSending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 disabled:bg-gray-300 shrink-0 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
