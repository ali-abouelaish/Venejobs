const SkillsSkeleton = () => (
    <div className="flex flex-wrap gap-3 lg:gap-5 w-full">
        {Array.from({ length: 6 }).map((_, index) => (
            <div
                key={index}
                className="animate-pulse py-3 px-4 border border-gray-200 rounded-lg
                   flex items-center gap-3 w-40"
            >
                <div className="w-4 h-4 bg-gray-300 rounded-full" />

                <div className="h-4 bg-gray-300 rounded w-20" />
            </div>
        ))}
    </div>
);

export default SkillsSkeleton;
