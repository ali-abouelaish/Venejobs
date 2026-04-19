'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { ChevronLeft, Maximize2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ClientLayout from '@/app/layout/ClientLayout';
import FreelancerLayout from '@/app/layout/FreelancerLayout';
import userApiStore from '@/app/store/userStore';
import type { Conversation, InboxRow } from '@/app/components/messages/types';
import { normalizeInboxRow } from '@/app/components/messages/types';
import type { WsIncoming } from '@/app/hooks/useMessages';
import ChatList from '@/app/components/messages/ChatList';
import ContactPanel from '@/app/components/messages/ContactPanel';
import { formatChatTime } from '@/app/components/messages/utils';
import Avatar from '@/app/components/Avatar';
import ChatPane from '@/app/components/ChatPane';
import ContractSidePanel from '@/app/components/ContractSidePanel';

type MobileView = 'list' | 'conversation' | 'contact' | 'contract';

function MessagesPageInner() {
  const searchParams = useSearchParams();
  const { user } = userApiStore() as { user: { id: number; name: string; role_name?: string; role_id?: number } | null };

  const preselect = searchParams.get('conversation');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(preselect);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<MobileView>(preselect ? 'conversation' : 'list');
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
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setMobileView('contact');
    } else {
      setShowContactPanel((prev) => !prev);
    }
  }

  function handleCloseContact() {
    const isMobile = window.innerWidth < 768;
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

  const Layout = user?.role_id === 3 ? FreelancerLayout : ClientLayout;

  return (
    <Layout>
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="md:max-w-[1280px] md:mx-auto md:px-6 md:py-6">
          <div
            className="flex bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-200 overflow-hidden h-screen md:h-[calc(100vh-120px)]"
          >
            {/* LEFT -- Chat list */}
            <div
              className={`flex-col border-r border-gray-200 bg-white h-full overflow-hidden
                ${mobileView === 'list' ? 'flex' : 'hidden'} md:flex`}
              style={{ width: '280px', minWidth: '280px', flexShrink: 0 }}
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

            {/* MIDDLE -- Conversation */}
            <div
              className={`flex-col flex-1 min-w-0 h-full
                ${mobileView === 'conversation' ? 'flex' : 'hidden'} md:flex`}
            >
              {selectedConversation && currentUserId !== null ? (
                <div className="flex flex-col h-full bg-white min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 shrink-0">
                    <button
                      onClick={handleBack}
                      className="md:hidden shrink-0 text-gray-400 hover:text-gray-600 mr-1"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <span className="text-base font-semibold text-gray-900 truncate">
                        {selectedConversation.job_title}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Avatar
                          id={selectedConversation.other_id}
                          name={selectedConversation.other_name}
                          src={selectedConversation.other_avatar}
                          size={28}
                        />
                        <span className="truncate">{selectedConversation.other_name}</span>
                        <span className="text-gray-300">&#183;</span>
                        <span className="text-xs text-gray-500 shrink-0">
                          {formatChatTime(selectedConversation.last_message_sent_at) || 'No activity yet'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenContact}
                      className="shrink-0 text-gray-400 hover:text-gray-600"
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
                <div className="hidden md:flex flex-1 items-center justify-center bg-white">
                  <p className="text-gray-500 text-sm">Select a conversation</p>
                </div>
              )}
            </div>

            {/* Mobile contract view (full screen) */}
            {sidePanelContractId &&
              selectedConversation &&
              currentUserId !== null &&
              user && (
                <div
                  className={`flex-col flex-1 min-w-0 h-full md:hidden
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
                className={`flex-col bg-[#FAFBFC] border-l border-gray-200 h-full overflow-hidden md:hidden
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

            {/* RIGHT (desktop) -- Contract side panel takes precedence over ContactPanel */}
            {selectedConversation &&
              currentUserId !== null &&
              user &&
              sidePanelContractId && (
                <div
                  className="hidden md:flex flex-col bg-[#FAFBFC] border-l border-gray-200 h-full overflow-hidden"
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

            {/* RIGHT (desktop) -- Contact panel (hidden when contract side panel is open) */}
            {selectedConversation && !sidePanelContractId && (
              <div
                className={`hidden flex-col bg-[#FAFBFC] border-l border-gray-200 h-full overflow-hidden
                  ${showContactPanel ? 'md:flex' : 'md:hidden'}`}
                style={{ width: '320px', minWidth: '320px', flexShrink: 0 }}
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
    </Layout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesPageInner />
    </Suspense>
  );
}
