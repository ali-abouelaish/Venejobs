
const BudgetSkeleton = () => {
    return (
        <div className="animate-pulse flex flex-col gap-3 border border-gray-200  rounded-lg p-5">
            <div className="w-10 h-10 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
        </div>
    );
};

export default BudgetSkeleton