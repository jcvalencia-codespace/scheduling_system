export default function AdminHoursSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Table skeleton structure */}
      <div className="bg-white shadow rounded-lg">
        <div className="min-w-full divide-y divide-gray-200">
          {/* Header */}
          <div className="bg-gray-50">
            <div className="grid grid-cols-5 px-6 py-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-2/3"></div>
              ))}
            </div>
          </div>
          
          {/* Body */}
          <div className="divide-y divide-gray-200 bg-white">
            {[...Array(5)].map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-5 px-6 py-4">
                {/* Requester column */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                {/* Request Date column */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                {/* Day & Time column */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                {/* Status column */}
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                {/* Actions column */}
                <div className="flex space-x-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
