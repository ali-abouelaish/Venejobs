import React from "react";

const CategorySkeleton = () => {
    return (
        <li className="text-center">
            <div
                className="flex flex-col py-3 px-4 items-center justify-center w-full
                   rounded-lg border border-gray-200
                   animate-pulse"
            >
                <div className="flex items-center gap-3">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                </div>
            </div>
        </li>
    );
};

export default CategorySkeleton;
