'use client';

const PALETTE = [
  '#5B8DEF',
  '#14B8A6',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#10B981',
  '#F43F5E',
  '#6366F1',
];

export function avatarColor(id: number | string): string {
  const n =
    typeof id === 'number'
      ? id
      : id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[Math.abs(n) % PALETTE.length];
}

export default function Avatar({
  id,
  name,
  src,
  size = 32,
  online,
}: {
  id: number | string;
  name?: string;
  src?: string | null;
  size?: number;
  online?: boolean;
}) {
  const dot = online !== undefined && (
    <span
      aria-hidden
      className="absolute bottom-0 right-0 rounded-full"
      style={{
        width: 8,
        height: 8,
        background: online ? '#10B981' : '#D1D5DB',
        boxShadow: '0 0 0 1.5px #FFFFFF',
      }}
    />
  );

  const inner = src ? (
    <img
      src={src}
      alt={name ?? ''}
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center text-white font-medium shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(id),
        fontSize: size * 0.4,
      }}
    >
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  );

  if (!dot) return inner;

  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      {inner}
      {dot}
    </span>
  );
}
