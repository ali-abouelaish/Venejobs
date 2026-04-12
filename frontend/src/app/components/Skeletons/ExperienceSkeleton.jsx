const ExperienceSkeleton = () => (
    <div className="animate-pulse w-full py-4 px-6 border border-gray-200 rounded-lg flex gap-4">
        <div className="w-4 h-4 bg-gray-300 rounded-full mt-1"></div>
        <div className="flex flex-col gap-2 w-full">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
);

export default ExperienceSkeleton