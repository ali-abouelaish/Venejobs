'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { ChevronLeft, Info } from 'lucide-react';
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
  const [contractsListVersion, setContractsListVersion] = useState(0);
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
      const activeId = selectedConversationIdRef.current;
      const normalized = (data.inbox ?? []).map(normalizeInboxRow).map((c) =>
        // The conversation the user is actively viewing is always treated as
        // read — masks the brief server-side lag between read POST and the
        // next fetchInbox (and matches what the user sees on screen).
        activeId && c.conversation_id === activeId
          ? { ...c, unread_count: 0 }
          : c,
      );
      setConversations(normalized);
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
          setContractsListVersion((v) => v + 1);
          if (sidePanelContractIdRef.current === event.contractId) {
            setContractRefreshCounter((v) => v + 1);
          }
          break;
        case 'new_contract':
          refetchInboxSoon();
          setContractsListVersion((v) => v + 1);
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
    // Optimistically clear the unread dot so it doesn't linger while we wait
    // for the read POST → server → inbox refetch round-trip.
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === conv.conversation_id
          ? { ...c, unread_count: 0 }
          : c,
      ),
    );
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
      <div className="min-h-screen bg-msg-canvas">
        <div className="md:max-w-350 md:mx-auto md:px-6 md:py-6">
          <div
            className="flex overflow-hidden h-screen md:h-[calc(100vh-168px)] md:msg-border md:rounded-msg-md bg-msg-surface"
          >
            {/* LEFT -- Chat list */}
            <div
              className={`flex-col msg-border-r bg-msg-aside h-full overflow-hidden
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
                <div className="flex flex-col h-full bg-msg-surface min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 msg-border-b shrink-0">
                    <button
                      onClick={handleBack}
                      className="md:hidden shrink-0 text-msg-text-tertiary hover:text-msg-text-secondary transition-colors duration-150"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <Avatar
                      id={selectedConversation.other_id}
                      name={selectedConversation.other_name}
                      src={selectedConversation.other_avatar}
                      size={32}
                    />

                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[13px] font-medium text-msg-text truncate leading-tight">
                        {selectedConversation.other_name}
                      </span>
                      <span className="text-[10px] text-msg-text-secondary truncate mt-0.5">
                        {selectedConversation.last_message_sent_at
                          ? `Active ${formatChatTime(selectedConversation.last_message_sent_at)}`
                          : 'No activity yet'}
                      </span>
                    </div>

                    <button
                      onClick={handleOpenContact}
                      title="Conversation details"
                      className="shrink-0 inline-flex items-center justify-center w-6 h-6 text-msg-text-tertiary hover:text-msg-text-secondary transition-colors duration-150"
                    >
                      <Info size={16} />
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
                <div className="hidden md:flex flex-1 items-center justify-center bg-msg-canvas">
                  <p className="text-msg-text-secondary text-[13px]">Select a conversation</p>
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
                className={`flex-col bg-msg-aside msg-border-l h-full overflow-hidden md:hidden
                  ${mobileView === 'contact' ? 'flex' : 'hidden'}`}
                style={{ width: '100%', minWidth: '260px', flexShrink: 0 }}
              >
                <ContactPanel
                  conversation={selectedConversation}
                  contractPrice={activeContractInfo?.price}
                  contractCurrency={activeContractInfo?.currency}
                  contractSigned={activeContractInfo?.signed}
                  contractId={activeContractInfo?.id}
                  activeContractId={sidePanelContractId}
                  contractEventVersion={contractsListVersion}
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
                  className="hidden md:flex flex-col bg-msg-aside msg-border-l h-full overflow-hidden"
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
                className={`hidden flex-col bg-msg-aside msg-border-l h-full overflow-hidden
                  ${showContactPanel ? 'md:flex' : 'md:hidden'}`}
                style={{ width: '320px', minWidth: '320px', flexShrink: 0 }}
              >
                <ContactPanel
                  conversation={selectedConversation}
                  contractPrice={activeContractInfo?.price}
                  contractCurrency={activeContractInfo?.currency}
                  contractSigned={activeContractInfo?.signed}
                  contractId={activeContractInfo?.id}
                  activeContractId={sidePanelContractId}
                  contractEventVersion={contractsListVersion}
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
