'use client';

export function ChatListSkeleton() {
  return (
    <div className="flex flex-col gap-0.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-2.5 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5 pt-0.5">
            <div className="h-2.5 bg-gray-200 animate-pulse rounded w-3/4" />
            <div className="h-2 bg-gray-200 animate-pulse rounded w-1/2" />
          </div>
          <div className="h-2 w-6 bg-gray-200 animate-pulse rounded shrink-0 mt-1" />
        </div>
      ))}
    </div>
  );
}

export function MessagesSkeleton() {
  const widths = [140, 200, 100, 180, 120, 160];
  return (
    <div className="flex flex-col gap-4 p-1">
      {widths.map((w, i) => {
        const own = i % 3 === 2;
        return (
          <div key={i} className={`flex ${own ? 'flex-row-reverse' : 'flex-row'} items-start gap-2.5`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
            <div
              className="h-10 bg-gray-200 animate-pulse rounded-xl"
              style={{ width: `${w}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}
