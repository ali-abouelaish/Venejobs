export default function PersonalInfoSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Title */}
            <div className="h-6 w-48 bg-gray-200 rounded" />

            {/* Input fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-10 w-full bg-gray-200 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Button */}
            <div className="h-10 w-32 bg-gray-300 rounded-lg" />
        </div>
    );
}