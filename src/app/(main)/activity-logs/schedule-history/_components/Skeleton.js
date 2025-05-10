export function ScheduleHistorySkeleton() {
  return (
    <div className="mt-4 flow-root animate-pulse">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <div className="bg-white dark:bg-gray-900">
              {/* Table Header */}
              <div className="bg-gray-100 dark:bg-gray-800">
                <div className="grid grid-cols-4 gap-4 px-4 py-3.5">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                    />
                  ))}
                </div>
              </div>

              {/* Table Body */}
              {[...Array(5)].map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-4 gap-4 px-4 py-4 border-t border-gray-200 dark:border-gray-700"
                >
                  {[...Array(4)].map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className="h-4 bg-gray-100 dark:bg-gray-800 rounded"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
