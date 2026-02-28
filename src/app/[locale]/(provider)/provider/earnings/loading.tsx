import { Skeleton } from "@/components/ui/skeleton";

export default function EarningsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-4">
        <Skeleton className="mb-4 h-6 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
