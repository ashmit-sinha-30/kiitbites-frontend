import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = "",
    width,
    height,
    borderRadius
}) => {
    return (
        <div
            className={`skeleton-base animate-skeleton ${className}`}
            style={{
                width: width,
                height: height,
                borderRadius: borderRadius
            }}
        />
    );
};

export const SkeletonCircle: React.FC<SkeletonProps & { size?: number | string }> = ({
    size = 40,
    className = ""
}) => {
    return (
        <Skeleton
            width={size}
            height={size}
            borderRadius="50%"
            className={className}
        />
    );
};

export const SkeletonText: React.FC<SkeletonProps & { lines?: number }> = ({
    lines = 1,
    className = "",
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height="1em"
                    width={i === lines - 1 && lines > 1 ? "70%" : "100%"}
                    {...props}
                />
            ))}
        </div>
    );
};

export const SkeletonCard: React.FC<{ children?: React.ReactNode; className?: string }> = ({
    children,
    className = ""
}) => {
    return (
        <div className={`p-4 border border-white/80 rounded-xl bg-white/60 backdrop-blur-md shadow-sm ${className}`}>
            {children || (
                <div className="flex flex-col gap-4">
                    <Skeleton height={150} className="rounded-lg" />
                    <SkeletonText lines={2} />
                    <div className="flex justify-between items-center mt-2">
                        <Skeleton width={80} height={24} />
                        <SkeletonCircle size={32} />
                    </div>
                </div>
            )}
        </div>
    );
};
