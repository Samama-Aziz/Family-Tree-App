"use client";

/**
 * Loading skeleton component for data tables and lists
 */

export function PersonSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 border rounded-lg bg-slate-50">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-slate-200 rounded w-1/3"></div>
        <div className="h-6 bg-slate-200 rounded w-20"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function FamilySkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 border rounded-lg bg-slate-50">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-slate-200 rounded w-2/5"></div>
        <div className="h-6 bg-slate-200 rounded w-20"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}

export function ListLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PersonSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Loading spinner component
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
      </div>
      <span className="ml-3 text-slate-600 font-medium">Loading...</span>
    </div>
  );
}
