'use client';

import * as React from 'react';
import { Icon, IconName } from './Icon';
import { Avatar, Badge, Card, Stars } from './Primitives';
import { fileSize, formatPrice, mimeKind, shortDate, relTime } from '../lib/format';
import { orderDisplay, serviceDisplay } from '../lib/state';

// ---------------------------- PageHeader ----------------------------
export function PageHeader({
  title, subtitle, action,
}: {
  title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--fg-4)', fontSize: 14, marginTop: 4, margin: 0 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------------------------- StatusLine ----------------------------
export function StatusLine({ label, ok, hint }: { label: React.ReactNode; ok: boolean; hint?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: ok ? 'var(--status-success-bg)' : 'var(--bg-muted)',
          color: ok ? 'var(--status-success)' : 'var(--fg-5)',
          display: 'grid', placeItems: 'center',
        }}
      >
        <Icon name={ok ? 'check' : 'clock'} size={12} strokeWidth={3} />
      </div>
      <div style={{ flex: 1, fontSize: 14, color: 'var(--fg-2)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>{hint}</div>
    </div>
  );
}

// ---------------------------- Stat ----------------------------
export function Stat({ label, value, icon }: { label: React.ReactNode; value: React.ReactNode; icon: IconName }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-4)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <Icon name={icon} size={12} />{label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', marginTop: 4 }}>{value}</div>
    </div>
  );
}

// ---------------------------- SummaryLine ----------------------------
export function SummaryLine({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-4)', marginTop: 6 }}>
      <span>{label}</span>
      <span style={{ color: 'var(--fg-2)' }}>{value}</span>
    </div>
  );
}

// ---------------------------- ServiceCard (browse + edit) ----------------------------
export interface ServiceCardData {
  id: string;
  title: string;
  freelancerId?: number;
  freelancerName?: string;
  basePrice: number;
  currency?: string;
  rating?: number;
  reviews?: number;
  coverImageUrl?: string | null;
  category?: string;
  deliveryDays?: number;
}
export function ServiceCard({
  service, onClick, accentColor = 'var(--bg-image-ph)',
}: {
  service: ServiceCardData;
  onClick?: () => void;
  accentColor?: string;
}) {
  return (
    <Card
      hoverable
      onClick={onClick}
      padding={0}
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div
        style={{
          height: 160,
          background: service.coverImageUrl ? `url(${service.coverImageUrl}) center/cover` : accentColor,
        }}
      />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {service.freelancerName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={service.freelancerName} size={28} tone="freelancer" />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-2)' }}>{service.freelancerName}</span>
          </div>
        )}
        <div
          style={{
            fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', minHeight: 40,
          }}
        >
          {service.title}
        </div>
        {service.rating != null && service.rating > 0 && (
          <Stars value={service.rating} count={service.reviews ?? null} />
        )}
        <div
          style={{
            marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--fg-4)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
            Starting at
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)' }}>
            {formatPrice(service.basePrice, { currency: service.currency })}
          </span>
        </div>
      </div>
    </Card>
  );
}

// Compact service card variant used on /freelancer/services (status + rejection reason).
export interface FreelancerServiceCardData extends ServiceCardData {
  status: string;
  rejectionReason?: string | null;
}
export function FreelancerServiceCard({
  service, onClick,
}: {
  service: FreelancerServiceCardData;
  onClick?: () => void;
}) {
  const display = serviceDisplay(service.status);
  return (
    <Card hoverable onClick={onClick} padding={0} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 120, background: service.coverImageUrl ? `url(${service.coverImageUrl}) center/cover` : 'var(--bg-image-ph)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <Badge tone={display.tone}>{display.label}</Badge>
        </div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div
          style={{
            fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {service.title || 'Untitled service'}
        </div>
        {service.status === 'rejected' && service.rejectionReason && (
          <div style={{ fontSize: 12, color: 'var(--status-error)', background: 'var(--status-error-bg)', padding: '8px 10px', borderRadius: 8, lineHeight: 1.5 }}>
            <b>Reason:</b> {service.rejectionReason}
          </div>
        )}
        {service.rating != null && service.rating > 0 && (
          <Stars value={service.rating} count={service.reviews ?? null} />
        )}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-2)' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>
            {service.basePrice ? formatPrice(service.basePrice, { currency: service.currency }) : 'No price set'}
          </span>
          {service.deliveryDays != null && (
            <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>{service.deliveryDays}d delivery</span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------- OrderListRow ----------------------------
export interface OrderRowData {
  id: string;
  serviceTitle: string;
  counterpartyName: string;
  state: string;
  deliveryDeadline: string | number | Date;
  totalAmount: number;
  currency?: string;
}
export function OrderListRow({
  order, viewerRole, onNavigate,
}: {
  order: OrderRowData;
  viewerRole: 'client' | 'freelancer';
  onNavigate: (to: string) => void;
}) {
  const display = orderDisplay(order.state);
  return (
    <Card hoverable padding={16} onClick={() => onNavigate(`/orders/${order.id}`)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Avatar
          name={order.counterpartyName}
          size={44}
          tone={viewerRole === 'freelancer' ? 'client' : 'freelancer'}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: 'var(--fg-4)', marginBottom: 2 }}>
            {viewerRole === 'freelancer' ? 'From' : 'By'} {order.counterpartyName} · #{order.id.slice(-4)}
          </div>
          <div
            style={{
              fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {order.serviceTitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 12, color: 'var(--fg-4)' }}>
            <span>
              <Icon name="calendar" size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              Due {shortDate(order.deliveryDeadline)}
            </span>
            <span>•</span>
            <span>{formatPrice(order.totalAmount, { currency: order.currency })}</span>
          </div>
        </div>
        <Badge tone={display.tone}>{display.label}</Badge>
        <Icon name="chevronRight" size={18} color="var(--fg-4)" className="vj-hide-on-mobile" />
      </div>
    </Card>
  );
}

// ---------------------------- AttachmentItem (read-only) ----------------------------
export interface AttachmentLike {
  id?: string;
  r2Key?: string;
  filename: string;
  size: number;
  mime: string;
  // Optional direct URL. When unset and `orderId` is provided, we link
  // through /api/service-orders/<orderId>/attachments?key=<r2Key> which
  // 302s to a short-lived signed R2 GET.
  url?: string | null;
}
export function AttachmentItem({ file, orderId }: { file: AttachmentLike; orderId?: string }) {
  const href = file.url
    ? file.url
    : orderId && file.r2Key
      ? `/api/service-orders/${orderId}/attachments?key=${encodeURIComponent(file.r2Key)}`
      : null;
  const baseProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = href
    ? { href, target: '_blank', rel: 'noreferrer' }
    : {};
  return (
    <a
      {...baseProps}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-2)',
        background: 'var(--bg-subtle)', textDecoration: 'none', color: 'inherit',
        cursor: href ? 'pointer' : 'default',
      }}
      onMouseEnter={e => { if (href) (e.currentTarget as HTMLElement).style.background = 'var(--bg-muted)'; }}
      onMouseLeave={e => { if (href) (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fff', color: 'var(--fg-3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={mimeKind(file.mime) === 'image' ? 'image' : 'file'} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.filename}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>{fileSize(file.size)}</div>
      </div>
      {href && <Icon name="download" size={16} color="var(--fg-4)" />}
    </a>
  );
}

// ---------------------------- OrderTimeline ----------------------------
export interface TimelineOrder {
  state: string;
  paidAt?: string | null;
  startedAt?: string | null;
  deliveredAt?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  disputes?: { raisedAt: string | number | Date }[];
}
export function OrderTimeline({ order }: { order: TimelineOrder }) {
  const after = (s: string) => ['in_progress', 'delivered', 'revision_requested', 'accepted', 'auto_accepted', 'completed', 'disputed'].indexOf(order.state) >=
    ['in_progress', 'delivered', 'revision_requested', 'accepted', 'auto_accepted', 'completed', 'disputed'].indexOf(s);
  const baseEvents: { label: string; at?: string | number | Date | null; done: boolean; tone?: 'error' }[] = [
    { label: 'Order paid',         at: order.paidAt,      done: !!order.paidAt },
    { label: 'Work in progress',   at: order.startedAt,   done: after('in_progress') },
    { label: 'Delivered',          at: order.deliveredAt, done: after('delivered') },
    { label: 'Accepted',           at: order.acceptedAt,  done: ['accepted', 'auto_accepted', 'completed'].includes(order.state) },
    { label: 'Funds transferred',  at: order.completedAt, done: order.state === 'completed' },
  ];
  if (order.state === 'cancelled' || order.state === 'refunded') {
    baseEvents.push({ label: order.state === 'refunded' ? 'Refunded' : 'Cancelled', at: order.cancelledAt, done: true, tone: 'error' });
  }
  if (order.state === 'disputed') {
    baseEvents.push({ label: 'Dispute filed', at: order.disputes?.[0]?.raisedAt, done: true, tone: 'error' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {baseEvents.map((e, i) => {
        const next = baseEvents[i + 1];
        return (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'stretch', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 22 }}>
              <div
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: e.done ? (e.tone === 'error' ? 'var(--status-error)' : 'var(--status-success)') : 'var(--bg-muted)',
                  color: e.done ? '#fff' : 'var(--fg-5)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  border: '2px solid #fff',
                  boxShadow: e.done ? '0 0 0 2px var(--status-success-bg)' : '0 0 0 2px var(--border-2)',
                }}
              >
                {e.done && <Icon name="check" size={11} strokeWidth={4} color="#fff" />}
              </div>
              {next && (
                <div
                  style={{
                    width: 2, flex: 1,
                    background: e.done && next.done ? 'var(--status-success)' : 'var(--border-2)',
                    margin: '2px 0',
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: next ? 18 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: e.done ? 'var(--fg-1)' : 'var(--fg-4)' }}>{e.label}</div>
              {e.at && <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 2 }}>{shortDate(e.at)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------- AdminTable ----------------------------
export function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="vj-admin-table" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans' }}>
        {children}
      </table>
    </div>
  );
}

export function relTimeOrFallback(ts?: string | number | Date | null) {
  if (!ts) return '...';
  return relTime(ts);
}
