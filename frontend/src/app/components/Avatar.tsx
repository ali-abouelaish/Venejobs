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
}: {
  id: number | string;
  name?: string;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = (name?.[0] ?? '?').toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(id),
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}
