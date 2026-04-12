export default function JobCardSkeleton() {
    return (
        <div className="rounded-lg border border-gray-200 p-6 flex flex-col gap-4 animate-pulse bg-white min-h-[260px]">
            <div className="flex justify-between">
                <div className="h-6 w-2/3 bg-gray-300 rounded"></div>
                <div className="h-4 w-24 bg-gray-300 rounded"></div>
            </div>

            <div className="h-4 w-3/4 bg-gray-300 rounded"></div>

            <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-20 bg-gray-300 rounded-full"></div>
                ))}
            </div>

            <div className="h-16 w-full bg-gray-300 rounded"></div>
        </div>
    );
}
