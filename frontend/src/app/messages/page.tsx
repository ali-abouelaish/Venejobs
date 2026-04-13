'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Clock, Briefcase, Maximize2 } from 'lucide-react';
import ClientLayout from '@/app/layout/ClientLayout';
import userApiStore from '@/app/store/userStore';
import type { Conversation, InboxRow } from '@/app/components/messages/types';
import { normalizeInboxRow } from '@/app/components/messages/types';
import type { WsIncoming } from '@/app/hooks/useMessages';
import ChatList from '@/app/components/messages/ChatList';
import ContactPanel from '@/app/components/messages/ContactPanel';
import { initials, formatChatTime } from '@/app/components/messages/utils';
import ChatPane from '@/app/components/ChatPane';
import ContractSidePanel from '@/app/components/ContractSidePanel';

type MobileView = 'list' | 'conversation' | 'contact' | 'contract';

export default function MessagesPage() {
  const { user } = userApiStore() as { user: { id: number; name: string; role_name?: string; role_id?: number } | null };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(true);

  // Contract side panel
  const [sidePanelContractId, setSidePanelContractId] = useState<string | null>(null);
  const [contractRefreshCounter, setContractRefreshCounter] = useState(0);
  const sidePanelContractIdRef = useRef<string | null>(null);
  useEffect(() => {
    sidePanelContractIdRef.current = sidePanelContractId;
  }, [sidePanelContractId]);

  // WS connection state for the active conversation (used by side panel banner)
  const [wsConnected, setWsConnected] = useState(false);

  // Signed contract info (for ContactPanel payment display)
  const [activeContractInfo, setActiveContractInfo] = useState<{ id: string; price: string; currency: string; signed: boolean } | null>(null);

  const selectedConversation =
    conversations.find((c) => c.conversation_id === selectedConversationId) ?? null;

  const selectedConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const currentUserIdRef = useRef<number | null>(null);
  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox');
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { inbox: InboxRow[] };
      setConversations((data.inbox ?? []).map(normalizeInboxRow));
      setError(null);
    } catch {
      setError('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Fallback poll every 3s to catch new conversations quickly
  useEffect(() => {
    const id = setInterval(fetchInbox, 3_000);
    return () => clearInterval(id);
  }, [fetchInbox]);

  // ── Debounced inbox refetch (200ms) ────────────────────────────────────────
  const inboxDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchInboxSoon = useCallback(() => {
    if (inboxDebounceRef.current) clearTimeout(inboxDebounceRef.current);
    inboxDebounceRef.current = setTimeout(() => {
      fetchInbox();
    }, 200);
  }, [fetchInbox]);

  useEffect(
    () => () => {
      if (inboxDebounceRef.current) clearTimeout(inboxDebounceRef.current);
    },
    [],
  );

  // ── WS event handler (from the active conversation's socket in useMessages) ──
  const handleWsEvent = useCallback(
    (event: WsIncoming) => {
      switch (event.type) {
        case 'new_message': {
          refetchInboxSoon();
          const activeConvId = selectedConversationIdRef.current;
          const myId = currentUserIdRef.current;
          // Auto mark-read: user is actively viewing this conversation
          if (
            activeConvId &&
            event.message.conversation_id === activeConvId &&
            myId !== null &&
            event.message.sender_id !== myId
          ) {
            void fetch(`/api/conversations/${activeConvId}/read`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message_id: event.message.id }),
            });
          }
          break;
        }
        case 'read_receipt':
          refetchInboxSoon();
          break;
        case 'message_deleted':
          refetchInboxSoon();
          break;
        case 'contract_updated':
          refetchInboxSoon();
          if (sidePanelContractIdRef.current === event.contractId) {
            setContractRefreshCounter((v) => v + 1);
          }
          break;
        case 'new_contract':
          refetchInboxSoon();
          break;
      }
    },
    [refetchInboxSoon],
  );

  function handleSelectConversation(conv: Conversation) {
    setSelectedConversationId(conv.conversation_id);
    setSidePanelContractId(null);
    setActiveContractInfo(null);
    setMobileView('conversation');
  }

  function handleOpenContract(contractId: string) {
    setSidePanelContractId(contractId);
    setContractRefreshCounter(0);
    setMobileView('contract');
  }

  function handleCloseContractPanel() {
    setSidePanelContractId(null);
    if (mobileView === 'contract') setMobileView('conversation');
  }

  const handleContractLoaded = useCallback((c: import('@/app/hooks/useMessages').ContractData) => {
    setActiveContractInfo({
      id: c.id,
      price: c.currentRevision?.price ?? '0',
      currency: c.currentRevision?.currency ?? 'USD',
      signed: c.status === 'accepted',
    });
  }, []);

  function handleOpenContact() {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      setMobileView('contact');
    } else {
      setShowContactPanel((prev) => !prev);
    }
  }

  function handleCloseContact() {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      setMobileView('conversation');
    } else {
      setShowContactPanel(false);
    }
  }

  const currentUserId = user?.id ?? null;

  function handleBack() {
    setMobileView('list');
  }

  return (
    <ClientLayout>
      <div className="bg-[#F3F4F6] px-4 py-6 lg:px-8" style={{ minHeight: 'calc(100vh - 72px)' }}>
        {/* Page title */}
        <h1 className="text-[28px] lg:text-[32px] font-bold text-[#111827] mb-5 max-w-[1200px] mx-auto">
          Messages
        </h1>

        {/* Card */}
        <div
          className="bg-white overflow-hidden mx-auto lg:rounded-2xl"
          style={{
            maxWidth: '1500px',
            height: '930px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex h-full">
            {/* LEFT — Chat list */}
            <div
              className={`flex-col border-r border-[#E5E7EB] bg-white h-full overflow-hidden
                ${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex`}
              style={{ width: '325px', minWidth: '325px', flexShrink: 0 }}
            >
              <ChatList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={handleSelectConversation}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isLoading={isLoadingConversations}
                error={error}
                onRetry={fetchInbox}
              />
            </div>

            {/* MIDDLE — Conversation */}
            <div
              className={`flex-col flex-1 min-w-0 h-full
                ${mobileView === 'conversation' ? 'flex' : 'hidden'} lg:flex`}
            >
              {selectedConversation && currentUserId !== null ? (
                <div className="flex flex-col h-full bg-white min-w-0">
                  {/* Header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB] shrink-0"
                    style={{ minHeight: '64px' }}
                  >
                    <button
                      onClick={handleBack}
                      className="lg:hidden shrink-0 text-[#6B7280] hover:text-[#111827] mr-1"
                    >
                      <ChevronLeft size={22} />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden">
                      {selectedConversation.other_avatar ? (
                        <img
                          src={selectedConversation.other_avatar}
                          alt={selectedConversation.other_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials(selectedConversation.other_name)
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="text-[15px] font-semibold text-[#111827] truncate">
                        {selectedConversation.other_name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[#6B7280] text-[12px] flex-wrap">
                        <Clock size={12} className="shrink-0" />
                        <span className="shrink-0">
                          {formatChatTime(selectedConversation.last_message_sent_at) || 'No activity yet'}
                        </span>
                        <span>·</span>
                        <Briefcase size={12} className="shrink-0" />
                        <span className="truncate">{selectedConversation.job_title}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenContact}
                      className="shrink-0 text-[#6B7280] hover:text-[#111827]"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>

                  {/* Chat body */}
                  <div className="flex-1 min-h-0">
                    <ChatPane
                      conversationId={selectedConversation.conversation_id}
                      currentUserId={currentUserId}
                      currentUserName={user?.name}
                      onOpenContract={handleOpenContract}
                      onWsEvent={handleWsEvent}
                      onWsConnectedChange={setWsConnected}
                    />
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex flex-1 items-center justify-center bg-white">
                  <p className="text-[#6B7280] text-[15px]">Select a conversation</p>
                </div>
              )}
            </div>

            {/* Mobile contract view (full screen) */}
            {sidePanelContractId &&
              selectedConversation &&
              currentUserId !== null &&
              user && (
                <div
                  className={`flex-col flex-1 min-w-0 h-full lg:hidden
                    ${mobileView === 'contract' ? 'flex' : 'hidden'}`}
                >
                  <ContractSidePanel
                    contractId={sidePanelContractId}
                    currentUserId={currentUserId}
                    currentUserName={user.name}
                    otherPartyName={selectedConversation.other_name}
                    wsConnected={wsConnected}
                    refreshCounter={contractRefreshCounter}
                    onClose={handleCloseContractPanel}
                    onContractLoaded={handleContractLoaded}
                  />
                </div>
              )}

            {/* Mobile contact panel */}
            {selectedConversation && (
              <div
                className={`flex-col bg-white border-l border-[#E5E7EB] h-full overflow-hidden lg:hidden
                  ${mobileView === 'contact' ? 'flex' : 'hidden'}`}
                style={{ width: '100%', minWidth: '260px', flexShrink: 0 }}
              >
                <ContactPanel
                  conversation={selectedConversation}
                  contractPrice={activeContractInfo?.price}
                  contractCurrency={activeContractInfo?.currency}
                  contractSigned={activeContractInfo?.signed}
                  contractId={activeContractInfo?.id}
                  onOpenContract={handleOpenContract}
                  onClose={handleCloseContact}
                />
              </div>
            )}

            {/* RIGHT (desktop) — Contract side panel takes precedence over ContactPanel */}
            {selectedConversation &&
              currentUserId !== null &&
              user &&
              sidePanelContractId && (
                <div
                  className="hidden lg:flex flex-col bg-white border-l border-[#E5E7EB] h-full overflow-hidden"
                  style={{ width: '525px', minWidth: '525px', flexShrink: 0 }}
                >
                  <ContractSidePanel
                    contractId={sidePanelContractId}
                    currentUserId={currentUserId}
                    currentUserName={user.name}
                    otherPartyName={selectedConversation.other_name}
                    wsConnected={wsConnected}
                    refreshCounter={contractRefreshCounter}
                    onClose={handleCloseContractPanel}
                    onContractLoaded={handleContractLoaded}
                  />
                </div>
              )}

            {/* RIGHT (desktop) — Contact panel (hidden when contract side panel is open) */}
            {selectedConversation && !sidePanelContractId && (
              <div
                className={`hidden flex-col bg-white border-l border-[#E5E7EB] h-full overflow-hidden
                  ${showContactPanel ? 'lg:flex' : 'lg:hidden'}`}
                style={{ width: '350px', minWidth: '350px', flexShrink: 0 }}
              >
                <ContactPanel
                  conversation={selectedConversation}
                  contractPrice={activeContractInfo?.price}
                  contractCurrency={activeContractInfo?.currency}
                  contractSigned={activeContractInfo?.signed}
                  contractId={activeContractInfo?.id}
                  onOpenContract={handleOpenContract}
                  onClose={handleCloseContact}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
