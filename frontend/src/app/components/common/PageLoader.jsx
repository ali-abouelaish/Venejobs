"use client";

export default function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
            <div className="flex gap-2">
                <span className="w-3 h-3 bg-secondary rounded-full animate-bounce" />
                <span
                    className="w-3 h-3 bg-secondary rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                />
                <span
                    className="w-3 h-3 bg-secondary rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                />
            </div>
        </div>
    );
}
