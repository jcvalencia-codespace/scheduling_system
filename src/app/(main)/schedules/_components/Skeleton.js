'use client';

export function ScheduleSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-6 gap-4 mb-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded"></div>
        ))}
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-4 mb-4">
          <div className="w-20 h-16 bg-gray-200 rounded"></div>
          {[...Array(6)].map((_, j) => (
            <div key={j} className="flex-1 h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

const SkeletonInput = () => (
  <div className="animate-pulse">
    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
    <div className="h-10 w-full bg-gray-200 rounded"></div>
  </div>
);

export default function ScheduleModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* School Year and Term Info Skeleton */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Checkboxes Skeleton */}
      <div className="flex gap-6">
        <div className="h-5 w-32 bg-gray-200 rounded"></div>
        <div className="h-5 w-32 bg-gray-200 rounded"></div>
      </div>

      {/* Form Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonInput key={`left-${i}`} />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonInput key={`right-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}