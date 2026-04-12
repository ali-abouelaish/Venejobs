const ShowDetailsPageSkeleton = () => {
    return (
        <div className="animate-pulse min-h-[calc(100vh-120px)] flex flex-col gap-8">
            {/* Header */}
            <div className="h-12 w-1/3 bg-gray-200 rounded" />

            {/* Panels */}
            <div className="flex flex-col lg:flex-row gap-8 flex-1">
                <div className="lg:w-1/3 h-full min-h-[400px] bg-gray-200 rounded" />
                <div className="lg:w-2/3 h-full min-h-[400px] bg-gray-200 rounded" />
            </div>

            {/* Bottom */}
            <div className="h-64 bg-gray-200 rounded" />
        </div>
    );
};

export default ShowDetailsPageSkeleton;
