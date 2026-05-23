'use client';

import * as React from 'react';
import { Icon, IconName } from './Icon';

export type Tone = 'client' | 'freelancer';

// ---------------------------- Logo ----------------------------
interface LogoProps {
  inverted?: boolean;
  tone?: Tone;
  size?: number;
  withWord?: boolean;
}
export function Logo({ inverted = false, tone = 'client', size = 36, withWord = true }: LogoProps) {
  const brand = tone === 'freelancer' ? 'var(--freelancer-primary)' : 'var(--client-primary)';
  const mark = (
    <div
      style={{
        width: size, height: size, borderRadius: 13,
        display: 'grid', placeItems: 'center',
        background: inverted ? '#fff' : brand,
        color: inverted ? brand : '#fff',
        fontFamily: 'Emblema One, serif',
        fontSize: size * 0.45, lineHeight: 1, flexShrink: 0,
      }}
    >
      VJ
    </div>
  );
  if (!withWord) return mark;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {mark}
      <span
        style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18,
          color: inverted ? '#fff' : 'var(--fg-1)',
        }}
      >
        Venejobs
      </span>
    </div>
  );
}

// ---------------------------- Button ----------------------------
type Variant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'outline';
type Size = 'sm' | 'md' | 'lg';
interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  tone?: 'client' | 'freelancer' | 'ink';
  danger?: boolean;
}
export function Button({
  children, variant = 'primary', size = 'md', icon, iconRight,
  loading, fullWidth, tone, danger, type = 'button',
  disabled, style, onClick, onMouseEnter, onMouseLeave, ...rest
}: ButtonProps) {
  const toneVars: React.CSSProperties =
    tone === 'freelancer'
      ? { ['--btn-brand' as never]: 'var(--freelancer-primary)', ['--btn-hover' as never]: 'var(--freelancer-primary-hover)', ['--btn-soft' as never]: 'var(--freelancer-primary-soft)' }
      : tone === 'client'
      ? { ['--btn-brand' as never]: 'var(--client-primary)', ['--btn-hover' as never]: 'var(--client-primary-hover)', ['--btn-soft' as never]: 'var(--client-primary-soft)' }
      : tone === 'ink'
      ? { ['--btn-brand' as never]: 'var(--brand-ink)', ['--btn-hover' as never]: '#000', ['--btn-soft' as never]: '#f5f5f5' }
      : { ['--btn-brand' as never]: 'var(--brand, var(--client-primary))', ['--btn-hover' as never]: 'var(--brand-hover, var(--client-primary-hover))', ['--btn-soft' as never]: 'var(--brand-soft, var(--client-primary-soft))' };
  const dangerVars: React.CSSProperties = danger
    ? { ['--btn-brand' as never]: 'var(--status-error)', ['--btn-hover' as never]: '#e85555', ['--btn-soft' as never]: 'var(--status-error-bg)' }
    : {};

  const dims = { sm: { padY: 8, padX: 14, fs: 13 }, md: { padY: 11, padX: 20, fs: 14 }, lg: { padY: 14, padX: 26, fs: 15 } }[size];

  const variants: Record<Variant, React.CSSProperties> = {
    primary:   { background: 'var(--btn-brand)', color: '#fff',                border: '1px solid var(--btn-brand)' },
    secondary: { background: '#fff',             color: 'var(--btn-brand)',    border: '1px solid var(--btn-brand)' },
    ghost:     { background: 'transparent',      color: 'var(--fg-2)',         border: '1px solid transparent' },
    soft:      { background: 'var(--btn-soft)',  color: 'var(--btn-brand)',    border: '1px solid transparent' },
    outline:   { background: '#fff',             color: 'var(--fg-2)',         border: '1px solid var(--border-3)' },
  };

  const handleOver: React.MouseEventHandler<HTMLButtonElement> = e => {
    if (disabled || loading) return;
    if (variant === 'primary') e.currentTarget.style.background = 'var(--btn-hover)';
    else if (variant === 'secondary' || variant === 'soft') e.currentTarget.style.background = 'var(--btn-soft)';
    else if (variant === 'outline' || variant === 'ghost') e.currentTarget.style.background = 'var(--bg-muted)';
    onMouseEnter?.(e);
  };
  const handleOut: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.currentTarget.style.background = variants[variant].background as string;
    onMouseLeave?.(e);
  };

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      onClick={loading ? undefined : onClick}
      onMouseEnter={handleOver}
      onMouseLeave={handleOut}
      style={{
        ...toneVars, ...dangerVars,
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: variant === 'primary' ? 600 : 500,
        fontSize: dims.fs, lineHeight: 1,
        padding: `${dims.padY}px ${dims.padX}px`,
        borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background 120ms var(--ease-out), color 120ms var(--ease-out), border-color 120ms var(--ease-out), box-shadow 120ms var(--ease-out)',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined,
        ...variants[variant],
        ...style,
      }}
    >
      {loading ? (
        <span
          style={{
            width: 14, height: 14, border: '2px solid currentColor',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'vj-spin 0.8s linear infinite',
          }}
        />
      ) : icon ? <Icon name={icon} size={16} /> : null}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={16} />}
    </button>
  );
}

// ---------------------------- IconButton ----------------------------
export interface IconButtonProps {
  icon: IconName;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  size?: number;
  danger?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
}
export function IconButton({ icon, title, onClick, size = 32, danger, style, disabled }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = danger ? 'var(--status-error-bg)' : 'var(--bg-muted)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      style={{
        width: size, height: size, borderRadius: 8,
        border: '1px solid transparent', background: 'transparent',
        color: danger ? 'var(--status-error)' : 'var(--fg-3)',
        display: 'inline-grid', placeItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 120ms var(--ease-out)',
        ...style,
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

// ---------------------------- Avatar ----------------------------
interface AvatarProps {
  name?: string;
  size?: number;
  src?: string | null;
  tone?: Tone;
}
export function Avatar({ name = 'AN', size = 40, src, tone = 'client' }: AvatarProps) {
  const brand = tone === 'freelancer' ? 'var(--freelancer-primary)' : 'var(--client-primary)';
  const initials = String(name).split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div
      title={name}
      style={{
        width: size, height: size, borderRadius: '50%',
        flexShrink: 0,
        background: src ? `${brand} url(${src}) center/cover` : brand,
        display: 'grid', placeItems: 'center',
        color: '#fff', fontWeight: 600, fontSize: size * 0.36,
        fontFamily: 'DM Sans, sans-serif',
        overflow: 'hidden',
      }}
    >
      {!src && initials}
    </div>
  );
}

// ---------------------------- Card ----------------------------
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  hoverable?: boolean;
  padding?: number | string;
  className?: string;
}
export function Card({ children, style, onClick, hoverable, padding = 24, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-card)',
        padding, cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 200ms var(--ease-out)',
        ...style,
      }}
      onMouseEnter={hoverable ? e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)') : undefined}
      onMouseLeave={hoverable ? e => (e.currentTarget.style.boxShadow = 'var(--shadow-card)') : undefined}
    >
      {children}
    </div>
  );
}

// ---------------------------- Badge ----------------------------
export type BadgeTone = 'success' | 'info' | 'warning' | 'error' | 'neutral' | 'brand';
interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}
const BADGE_TONES: Record<BadgeTone, { bg: string; color: string }> = {
  success: { bg: 'var(--status-success-bg)', color: 'var(--freelancer-primary-deep)' },
  info:    { bg: 'var(--status-info-bg)',    color: 'var(--client-primary)' },
  warning: { bg: 'var(--status-warning-bg)', color: '#7a5a00' },
  error:   { bg: 'var(--status-error-bg)',   color: '#8a2828' },
  neutral: { bg: 'var(--bg-muted)',          color: 'var(--fg-3)' },
  brand:   { bg: 'var(--brand-soft, var(--client-primary-soft))', color: 'var(--brand, var(--client-primary))' },
};
export function Badge({ tone = 'neutral', children, dot = true, size = 'md', style }: BadgeProps) {
  const t = BADGE_TONES[tone];
  const padding = size === 'sm' ? '3px 8px' : '5px 10px';
  const fs = size === 'sm' ? 11 : 12;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding, borderRadius: 9999, fontSize: fs, fontWeight: 600,
        background: t.bg, color: t.color,
        fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  );
}

// ---------------------------- Stars ----------------------------
interface StarsProps {
  value?: number;
  count?: number | null;
  size?: number;
  color?: string;
}
export function Stars({ value = 5, count = null, size = 14, color = 'var(--accent-amber)' }: StarsProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--fg-2)', fontSize: 13, fontWeight: 600 }}>
      <Icon name="star" size={size} color={color} />
      {value.toFixed(1)}
      {count != null && <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>({count})</span>}
    </span>
  );
}
