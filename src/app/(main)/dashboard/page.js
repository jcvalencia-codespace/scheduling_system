import Statistics from "./_components/Statistics"
import RoomList from "./_components/RoomList"
import ActionButtons from "./_components/ActionButtons"
import RecentActivities from "./_components/RecentActivities"
import UnscheduledClasses from "./_components/UnscheduledClasses"

export default function DashboardPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <main className="container mx-auto px-4 -mt-2">
        <div className="space-y-6">
          {/* Title */}
          <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Welcome back, Admin. Here's what's happening today.
              </p>
            </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Charts and Stats Container */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Chart */}
                <div className="col-span-4">
                  <RoomList chartType="bar" title="Registered Rooms" />
                </div>
                
                {/* Right Chart */}
                <div className="col-span-4">
                  <RoomList chartType="column" title="Room Usage Frequency" />
                </div>

                {/* Statistics Column */}
                <div className="col-span-4 grid grid-cols-2 gap-4 content-start">
                  <Statistics type="term" />
                  <Statistics type="schedules" />
                  <Statistics type="subjects" />
                  <Statistics type="faculties" />
                </div>
              </div>
              
              {/* Bottom Row - Actions and Activities */}
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-4">
                  <ActionButtons />
                </div>
                <div className="col-span-8">
                  <RecentActivities />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-4">
              <UnscheduledClasses />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
