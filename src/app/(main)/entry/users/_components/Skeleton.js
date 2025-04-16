export function FullFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {/* First Name and Last Name */}
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
            <div className="h-9 bg-gray-200 rounded"></div>
          </div>
        ))}

        {/* Middle Name */}
        <div className="sm:col-span-2 animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
          <div className="h-9 bg-gray-200 rounded"></div>
        </div>

        {/* Email */}
        <div className="sm:col-span-2 animate-pulse">
          <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
          <div className="h-9 bg-gray-200 rounded"></div>
        </div>

        {/* Password */}
        <div className="sm:col-span-2 animate-pulse">
          <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
          <div className="h-9 bg-gray-200 rounded"></div>
        </div>

        {/* Role, Department, Course, Employment Type */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i + 4} className="animate-pulse">
            <div className="h-4 w-28 bg-gray-200 rounded mb-1"></div>
            <div className="h-9 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <div className="inline-flex w-full sm:w-20 h-9 bg-gray-200 rounded animate-pulse sm:ml-3"></div>
        <div className="mt-3 sm:mt-0 inline-flex w-full sm:w-20 h-9 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}
export function CourseDropdownSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-28 bg-gray-200 rounded mb-1"></div>
      <div className="h-9 bg-gray-200 rounded"></div>
    </div>
  );
}