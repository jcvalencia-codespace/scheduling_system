'use client';

export function UserListSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Search Bar Skeleton */}
      <div className="p-4 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Users List Skeleton */}
      <div className="overflow-y-auto flex-1">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="p-4 border-b">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center flex-grow">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                </div>
                <div className="ml-3 flex-grow space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatWindowSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header Skeleton */}
      <div className="p-4 border-b bg-blue-50">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] h-12 rounded-lg ${index % 2 === 0 ? 'bg-blue-200' : 'bg-gray-200'} animate-pulse`}
              style={{ width: `${Math.random() * 30 + 40}%` }}
            />
          </div>
        ))}
      </div>

      {/* Input Box Skeleton */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  );
}