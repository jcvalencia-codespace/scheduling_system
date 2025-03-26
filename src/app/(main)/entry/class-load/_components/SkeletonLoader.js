export function DropdownSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Select control box */}
      <div className="h-9 bg-gray-200 rounded-md border border-gray-300"></div>
      {/* Loading indicator placeholder */}
      <div className="mt-1.5 flex items-center space-x-2 px-2">
        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
