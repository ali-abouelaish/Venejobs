const WorkHistoryPageSkeleton = () => {
    return (
        <div className="flex flex-col gap-4 animate-pulse">

            {/* Header */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2 w-full">
                    {/* Job title */}
                    <div className="h-4 sm:h-5 w-2/5 bg-gray-200 rounded" />

                    {/* Date */}
                    <div className="h-3 sm:h-4 w-1/3 bg-gray-200 rounded" />
                </div>

                {/* Action icons */}
                <div className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-gray-200 rounded-full" />
                    <div className="h-5 w-5 bg-gray-200 rounded-full" />
                </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
                <div className="h-3 sm:h-4 w-full bg-gray-200 rounded" />
                <div className="h-3 sm:h-4 w-11/12 bg-gray-200 rounded" />
                <div className="h-3 sm:h-4 w-4/5 bg-gray-200 rounded" />
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gray-200 mt-2" />
        </div>
    );
};

export default WorkHistoryPageSkeleton;
