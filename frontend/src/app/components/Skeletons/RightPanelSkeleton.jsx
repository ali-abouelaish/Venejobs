import React from "react";

const RightPanelSkeleton = () => {
    return (
        <div className="flex flex-col gap-10 animate-pulse">

            {/* ===== HEADER SKELETON ===== */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="h-5 sm:h-6 w-1/3 bg-gray-200 rounded" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>

                <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-200 rounded" />
                    <div className="h-3 w-5/6 bg-gray-200 rounded" />
                </div>
            </div>

            <hr className="text-gray-200" />

            {/* ===== PORTFOLIO SKELETON ===== */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="h-5 w-32 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                </div>

                {[1, 2].map((_, i) => (
                    <div key={i} className="flex justify-between items-start">
                        <div className="flex flex-col gap-2 w-full">
                            <div className="h-4 w-1/3 bg-gray-200 rounded" />
                            <div className="h-3 w-2/3 bg-gray-200 rounded" />
                        </div>
                        <div className="flex gap-3">
                            <div className="h-4 w-4 bg-gray-200 rounded-full" />
                            <div className="h-4 w-4 bg-gray-200 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            <hr className="text-gray-200" />

            {/* ===== SKILLS SKELETON ===== */}
            <div className="flex flex-col gap-4">
                <div className="h-5 w-24 bg-gray-200 rounded" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((_, i) => (
                        <div
                            key={i}
                            className="h-10 bg-gray-200 rounded"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RightPanelSkeleton;
