import { Skeleton } from "@/components/ui/skeleton";

export default function ClientLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Hero skeleton */}
      <div className="flex flex-col items-center text-center">
        <Skeleton className="h-12 w-3/4 max-w-xl" />
        <Skeleton className="mt-4 h-6 w-2/3 max-w-md" />
        <Skeleton className="mt-8 h-12 w-full max-w-lg rounded-full" />
        <div className="mt-6 flex gap-4">
          <Skeleton className="h-12 w-40 rounded-full" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>

      {/* Category grid skeleton */}
      <div className="mt-16">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-xl border p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
