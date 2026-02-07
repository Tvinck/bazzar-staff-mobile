import React from 'react';

export const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse bg-white/5 rounded-xl ${className}`}
            {...props}
        />
    );
};

export const OrderSkeleton = () => {
    return (
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl mb-3">
            <div className="flex justify-between items-start mb-3">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-12" />
                </div>
            </div>
            <div className="pt-3 border-t border-white/5 mt-3 flex justify-between items-center">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </div>
    );
};

export const ChatSkeleton = () => {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-white/5">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-48" />
            </div>
        </div>
    );
};

export const TransactionSkeleton = () => {
    return (
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-20" />
                </div>
            </div>
            <Skeleton className="h-5 w-20" />
        </div>
    );
};
