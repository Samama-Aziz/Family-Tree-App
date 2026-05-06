"use client";

/**
 * Loading spinner component
 */
export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-primary animate-spin"></div>
      </div>
      {text && <span className="mt-4 text-slate-500 text-sm font-medium tracking-wide">{text}</span>}
    </div>
  );
}

/**
 * Helper components that use the main spinner
 */

export function ListLoadingSkeleton({ count = 3 }: { count?: number }) {
  return <LoadingSpinner text="Fetching data..." />;
}

export function PersonSkeleton() {
  return <LoadingSpinner text="Loading persons..." />;
}

export function FamilySkeleton() {
  return <LoadingSpinner text="Loading families..." />;
}

