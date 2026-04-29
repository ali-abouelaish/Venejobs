'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Wallet,
  Clock,
  BarChart3,
  Briefcase,
  Bookmark,
  Share2,
  Flag,
  FileText,
  MapPin,
  CheckCircle2,
  Calendar,
  Users,
} from 'lucide-react';
import ProposalForm from '@/app/components/ProposalForm';
import type { MyProposalForJob } from '@/lib/proposals';

export interface JobDetailData {
  job: {
    id: number;
    clientId: number;
    title: string;
    description: string;
    category: string | null;
    skills: { name: string; level?: string }[];
    projectSize: string | null;
    duration: string | null;
    experienceLevel: string | null;
    budgetType: string | null;
    budgetAmount: number | null;
    attachment: string | null;
    status: string;
    createdAt: string;
  };
  client: {
    id: number;
    name: string;
    profilePicture: string | null;
    city: string | null;
    country: string | null;
    createdAt: string;
    jobsPosted: number;
  } | null;
  proposalCount: number;
  myProposal: MyProposalForJob | null;
  viewerId: number | null;
}

function formatDuration(duration: string | null): string {
  if (!duration) return '—';
  if (duration === 'ongoing') return 'Ongoing';
  const parts = duration.split('_');
  if (parts.length === 3) return `${parts[0]} to ${parts[1]} ${parts[2]}`;
  return duration;
}

function formatCategory(cat: string | null): string {
  if (!cat) return '—';
  return cat.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return new Date(dateStr).toLocaleDateString();
}

function memberSince(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function fileExtension(path: string): string {
  const idx = path.lastIndexOf('.');
  return idx >= 0 ? path.slice(idx + 1).toUpperCase() : 'FILE';
}

function statusLabel(status: string): { dot: string; text: string; label: string } {
  switch (status) {
    case 'published':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Published' };
    case 'filled':
      return { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Position filled' };
    case 'paused':
      return { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Paused' };
    case 'closed':
      return { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Closed' };
    case 'draft':
      return { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Draft' };
    default:
      return { dot: 'bg-slate-400', text: 'text-slate-600', label: status };
  }
}

const CARD = 'rounded-xl border border-slate-200 bg-white p-6';

export default function JobDetailView({ data }: { data: JobDetailData }) {
  const { job, client, proposalCount, myProposal, viewerId } = data;
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [applied, setApplied] = useState<MyProposalForJob | null>(myProposal);

  const isOwner = viewerId !== null && viewerId === job.clientId;
  const isFilled = job.status === 'filled';
  const isPublished = job.status === 'published';
  const canApply = Boolean(viewerId) && !isOwner && isPublished && !applied;
  const status = statusLabel(job.status);

  const handleApplySuccess = (proposalId: number, conversationId: string | null): void => {
    setApplied({
      id: proposalId,
      status: 'pending',
      proposedAmount: '',
      estimatedDuration: '',
      createdAt: new Date().toISOString(),
      conversationId,
    });
    setShowForm(false);
    if (conversationId) {
      router.push(`/messages?conversation=${conversationId}`);
    }
  };

  const proposalHref = applied?.conversationId
    ? `/messages?conversation=${applied.conversationId}`
    : null;

  return (
    <div className="max-w-[1200px] mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* ─── Main column ─── */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Title card */}
          <section className={CARD}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-[28px] font-semibold text-heading leading-tight">
                  {job.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-paragraph">
                  <span className={`inline-flex items-center gap-2 ${status.text} font-medium`}>
                    <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>Posted {daysAgo(job.createdAt)}</span>
                  <span className="text-slate-300">·</span>
                  <span>{formatCategory(job.category)}</span>
                  <span className="text-slate-300">·</span>
                  <span>{proposalCount} {proposalCount === 1 ? 'proposal' : 'proposals'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* TODO: wire bookmark to save-job endpoint when the saved_jobs table is added */}
                <IconButton label="Save job" onClick={() => {}}>
                  <Bookmark className="w-4 h-4" />
                </IconButton>
                {/* TODO: share */}
                <IconButton label="Share" onClick={() => {}}>
                  <Share2 className="w-4 h-4" />
                </IconButton>
                {/* TODO: report */}
                <IconButton label="Report" onClick={() => {}}>
                  <Flag className="w-4 h-4" />
                </IconButton>
              </div>
            </div>

            {/* Quick facts */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickFact icon={<Wallet className="w-4 h-4" />} label={`${job.budgetType ?? 'Budget'} price`.replace(/\b\w/g, (c) => c.toUpperCase())} value={job.budgetAmount != null ? `$${Number(job.budgetAmount).toLocaleString()}` : '—'} />
              <QuickFact icon={<Clock className="w-4 h-4" />} label="Duration" value={formatDuration(job.duration)} />
              <QuickFact icon={<BarChart3 className="w-4 h-4" />} label="Experience" value={capitalize(job.experienceLevel) ?? '—'} />
              <QuickFact icon={<Briefcase className="w-4 h-4" />} label="Project size" value={capitalize(job.projectSize) ?? '—'} />
            </div>
          </section>

          {/* Description */}
          <section className={CARD}>
            <h2 className="font-semibold text-lg text-heading">Project Description</h2>
            <div className="mt-3 markdown-body text-paragraph text-[15px] leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: (p) => <h3 className="text-lg font-semibold text-heading mt-4 mb-2" {...p} />,
                  h2: (p) => <h3 className="text-lg font-semibold text-heading mt-4 mb-2" {...p} />,
                  h3: (p) => <h4 className="text-base font-semibold text-heading mt-3 mb-2" {...p} />,
                  p: (p) => <p className="mb-3 last:mb-0" {...p} />,
                  ul: (p) => <ul className="list-disc pl-5 mb-3 space-y-1" {...p} />,
                  ol: (p) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...p} />,
                  li: (p) => <li className="leading-relaxed" {...p} />,
                  strong: (p) => <strong className="font-semibold text-heading" {...p} />,
                  em: (p) => <em className="italic" {...p} />,
                  a: (p) => <a className="text-secondary underline hover:opacity-80" target="_blank" rel="noreferrer" {...p} />,
                  hr: () => <hr className="my-4 border-slate-200" />,
                  code: (p) => <code className="bg-slate-100 text-heading px-1.5 py-0.5 rounded text-[13px]" {...p} />,
                  blockquote: (p) => <blockquote className="border-l-4 border-slate-200 pl-4 italic text-slate-600 my-3" {...p} />,
                }}
              >
                {job.description ?? ''}
              </ReactMarkdown>
            </div>
          </section>

          {/* Skills */}
          {job.skills.length > 0 && (
            <section className={CARD}>
              <h2 className="font-semibold text-lg text-heading">Skills & Expertise</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <span
                    key={`${skill.name}-${i}`}
                    className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-paragraph text-sm font-medium"
                  >
                    {skill.name}
                    {skill.level && <span className="text-xs text-slate-400">· {skill.level}</span>}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Attachments */}
          {job.attachment && (
            <section className={CARD}>
              <h2 className="font-semibold text-lg text-heading">Attachments</h2>
              <div className="mt-3">
                <AttachmentRow path={job.attachment} />
              </div>
            </section>
          )}

          {/* About the client */}
          {client && <AboutClientCard client={client} />}
        </div>

        {/* ─── Sidebar ─── */}
        <aside className="lg:sticky lg:top-[96px] lg:self-start flex flex-col gap-6">
          <section className={CARD}>
            {isOwner ? (
              <div className="text-sm text-paragraph italic text-center">
                This is your job posting.
              </div>
            ) : isFilled ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 text-sm font-semibold text-center">
                Position filled — no longer accepting proposals
              </div>
            ) : applied ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Proposal submitted · Applied {relativeTime(applied.createdAt)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-full bg-slate-100 text-slate-400 px-4 py-3 rounded-lg font-semibold text-sm cursor-not-allowed"
                >
                  Already applied
                </button>
                {proposalHref && (
                  <Link
                    href={proposalHref}
                    className="w-full text-center bg-white border border-secondary text-secondary px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-secondary/5"
                  >
                    View your proposal
                  </Link>
                )}
                <p className="text-xs text-paragraph text-center">
                  The client will message you here if they want to move forward.
                </p>
              </div>
            ) : !viewerId ? (
              <Link
                href="/auth/signin"
                className="block text-center bg-secondary text-white px-4 py-3 rounded-lg font-semibold text-sm hover:opacity-95"
              >
                Sign in to apply
              </Link>
            ) : canApply ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="w-full bg-secondary text-white px-4 py-3 rounded-lg font-semibold text-sm hover:opacity-95"
                >
                  Apply now
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="w-full bg-white border border-slate-200 text-heading px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-50"
                >
                  Save for later
                </button>
              </div>
            ) : null}
          </section>

          {/* About the job quick sidebar */}
          <section className={CARD}>
            <h3 className="font-semibold text-heading text-base mb-4">About the job</h3>
            <div className="flex flex-col gap-3 text-sm">
              <SidebarFact label="Budget" value={job.budgetAmount != null ? `$${Number(job.budgetAmount).toLocaleString()} · ${capitalize(job.budgetType) ?? ''}` : '—'} />
              <SidebarFact label="Duration" value={formatDuration(job.duration)} />
              <SidebarFact label="Experience" value={capitalize(job.experienceLevel) ?? '—'} />
              <SidebarFact label="Project size" value={capitalize(job.projectSize) ?? '—'} />
              <SidebarFact label="Category" value={formatCategory(job.category)} />
            </div>
          </section>
        </aside>
      </div>

      {/* Apply modal / drawer */}
      {showForm && canApply && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-heading">Submit a proposal</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-paragraph text-sm hover:text-heading"
              >
                Cancel
              </button>
            </div>
            <ProposalForm jobId={job.id} onSuccess={handleApplySuccess} />
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-heading"
    >
      {children}
    </button>
  );
}

function QuickFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-2 text-xs text-paragraph">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      <span className="font-semibold text-heading text-sm">{value}</span>
    </div>
  );
}

function SidebarFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-paragraph">{label}</span>
      <span className="font-semibold text-heading text-right">{value}</span>
    </div>
  );
}

function AttachmentRow({ path }: { path: string }) {
  const name = path.split('/').pop() ?? path;
  const ext = fileExtension(name);
  const isPdf = ext === 'PDF';
  const href = path.startsWith('http')
    ? path
    : `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}${path}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-3 hover:bg-slate-50 transition"
    >
      <div
        className={`p-2 rounded-lg ${isPdf ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}
      >
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-heading text-sm font-medium truncate">{name}</p>
        <p className="text-paragraph text-xs">{ext} file</p>
      </div>
      <span className="text-secondary text-sm font-semibold">Download</span>
    </a>
  );
}

function AboutClientCard({
  client,
}: {
  client: NonNullable<JobDetailData['client']>;
}) {
  const location = [client.city, client.country].filter(Boolean).join(', ');
  const avatarSrc = client.profilePicture
    ? (client.profilePicture.startsWith('http')
        ? client.profilePicture
        : `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}${client.profilePicture}`)
    : null;
  const initial = client.name.charAt(0).toUpperCase();

  return (
    <section className={CARD}>
      <h2 className="font-semibold text-lg text-heading">About the client</h2>
      <div className="mt-4 flex items-start gap-4">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            alt={client.name}
            className="w-12 h-12 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-heading font-semibold">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-heading">{client.name}</p>
          {location && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-paragraph">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-xs text-paragraph">Member since</span>
            <span className="font-semibold text-heading">{memberSince(client.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-xs text-paragraph">Jobs posted</span>
            <span className="font-semibold text-heading">{client.jobsPosted}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function capitalize(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
