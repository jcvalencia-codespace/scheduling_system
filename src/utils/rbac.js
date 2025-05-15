// Role-based access control utilities

// Define role-based permissions
export const rolePermissions = {
  Administrator: ['*'], // Full access to all routes and features
  Dean: [
    '/dashboard',
    '/schedules',
    '/entry',
    '/entry/class-load',
    '/logs',
    '/activity-logs/schedule-history',
    '/activity-logs/archive',
    '/term',
    '/feedback',
    '/chats',
    '/admin-hours',
    '/settings',
    '/schedule-archive',
    '/schedule-archive/faculty',
    '/schedule-archive/block'
  ],
  'Program Chair': [
    '/dashboard',
    '/schedules',
    '/entry',
    '/entry/class-load',
    '/logs',
    '/activity-logs/schedule-history',
    '/activity-logs/archive',
    '/term',
    '/feedback',
    '/settings',
    '/chats',
    '/schedule-archive',
    '/schedule-archive/faculty',
    '/schedule-archive/block'
  ],
  Faculty: [
    '/schedules/faculty',  // Changed from /schedules
    '/feedback',
    '/profile',
    '/chats',
    '/schedule-archive',
    '/schedule-archive/faculty',
    '/settings',
    '/schedule-archive/block'
  ]
};

// Define menu items with their access roles
export const menuItems = [
  {
    title: 'Dasdhboard',
    href: '/dashboard',
    icon: 'ChartBarIcon',
    roles: ['Administrator', 'Dean', 'Program Chair']
  },
  {
    title: 'Schedules',
    href: '/schedules',  // This will be dynamically changed for Faculty
    icon: 'CalendarDaysIcon',
    roles: ['Administrator', 'Dean', 'Program Chair', 'Faculty']
  },
  {
    title: 'Entry',
    href: '/entry',
    icon: 'PencilSquareIcon',
    roles: ['Administrator', 'Dean', 'Program Chair'],
    hasDropdown: true,
    subItems: [
      { 
        title: 'Subjects',
        href: '/entry/subjects',
        icon: 'BookOpenIcon',
        roles: ['Administrator', 'Dean', 'Program Chair']
      },
      { 
        title: 'Sections',
        href: '/entry/sections',
        icon: 'BuildingLibraryIcon',
        roles: ['Administrator', 'Dean', 'Program Chair']
      },
      { 
        title: 'Class Load',
        href: '/entry/class-load',
        icon: 'BuildingLibraryIcon',
        roles: ['Administrator', 'Dean', 'Program Chair']
      },
      { 
        title: 'Rooms',
        href: '/entry/rooms',
        icon: 'BuildingLibraryIcon',
        roles: ['Administrator']
      },
      { 
        title: 'Users',
        href: '/entry/users',
        icon: 'UsersIcon',
        roles: ['Administrator']
      }
    ]
  },
  {
    title: 'Maintenance',
    href: '/maintenance',
    icon: 'WrenchScrewdriverIcon',
    roles: ['Administrator'],
    hasDropdown: true,
    subItems: [
      { 
        title: 'Courses',
        href: '/maintenance/courses',
        icon: 'ListBulletIcon',
        roles: ['Administrator']
      },
      { 
        title: 'Departments',
        href: '/maintenance/departments',
        icon: 'ListBulletIcon',
        roles: ['Administrator']
      },
      { 
        title: 'Designations',
        href: '/maintenance/designations',
        icon: 'BookOpenIcon',
        roles: ['Administrator']
      }
    ]
  },
  {
    title: 'Term',
    href: '/term',
    icon: 'AcademicCapIcon',
    roles: ['Administrator', 'Dean', 'Program Chair']
  },
  // {
  //   title: 'Override Requests',
  //   href: '/override-requests',
  //   icon: 'ArrowPathIcon',
  //   roles: ['Administrator']
  // },
  {
    title: 'Activity Logs',
    href: '/logs',
    icon: 'ClipboardDocumentListIcon',
    roles: ['Administrator', 'Dean', 'Program Chair'],
    hasDropdown: true,
    subItems: [
      { 
        title: 'Schedule History',
        href: '/activity-logs/schedule-history',
        icon: 'ListBulletIcon',
        roles: ['Administrator', 'Dean', 'Program Chair']
      },
      { 
        title: 'Override History',
        href: '/logs/override-history',
        icon: 'ListBulletIcon',
        roles: ['Administrator', 'Dean', 'Program Chair']
      },
      { 
        title: 'Archive',
        href: '/logs/archive',
        icon: 'ListBulletIcon',
        roles: ['Administrator', 'Dean', 'Program Chair']
      }
    ]
  },
  {
    title: 'Admin Hours',
    href: '/admin-hours',
    icon: 'ClockIcon',
    roles: ['Administrator', 'Dean']
  },
  {
    title: 'Send Feedback',
    href: '/feedback',
    icon: 'EnvelopeIcon',
    roles: ['Administrator', 'Dean', 'Program Chair', 'Faculty']
  },
  {
    title: 'Chats',
    href: '/chats',
    icon: 'ChatBubbleLeftRightIcon',
    roles: ['Administrator', 'Dean', 'Program Chair', 'Faculty']
  },
  {
    title: 'Schedule Archive',
    href: '/schedule-archive',
    icon: 'ArchiveBoxIcon',
    roles: ['Administrator', 'Dean', 'Program Chair', 'Faculty']
  }
];

// Check if a user has permission for a specific path
export function hasPermission(userRole, path) {
  // If no role provided, deny access
  if (!userRole) return false;

  // Get permissions for the role
  const permissions = rolePermissions[userRole];

  // If role not found in permissions, deny access
  if (!permissions) return false;

  // Admin has access to everything
  if (permissions.includes('*')) return true;

  // Check if the path matches any allowed paths
  return permissions.some(allowedPath => path.startsWith(allowedPath));
}

// Get menu items filtered by user role
export function getMenuItemsByRole(userRole) {
  if (!userRole) return [];

  return menuItems.filter(item => {
    // Check if the user's role is included in the item's allowed roles
    const hasAccess = item.roles.includes(userRole);

    if (item.hasDropdown && hasAccess) {
      // Filter subItems based on role as well
      const filteredSubItems = item.subItems.filter(subItem => 
        subItem.roles.includes(userRole)
      );
      
      // Only include dropdown items if there are accessible subitems
      return filteredSubItems.length > 0;
    }

    return hasAccess;
  }).map(item => {
    if (item.hasDropdown) {
      return {
        ...item,
        subItems: item.subItems.filter(subItem => 
          subItem.roles.includes(userRole)
        )
      };
    }
    return item;
  });
}

// Server-side function to verify role-based access
export async function verifyAccess(session, pathname) {
  // If no session or user, deny access
  if (!session?.user) return false;

  return hasPermission(session.user.role, pathname);
}