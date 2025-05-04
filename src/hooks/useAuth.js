'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { hasPermission } from '@/utils/rbac';

const publicPaths = ['/login', '/forgot-password'];

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // If on a public path and user is authenticated, redirect to home
    if (publicPaths.includes(pathname) && isAuthenticated) {
      router.push('/schedules');
      return;
    }

    // If on a protected path and user is not authenticated, redirect to login
    if (!publicPaths.includes(pathname) && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check role-based access for authenticated users on protected paths
    if (isAuthenticated && !publicPaths.includes(pathname)) {
      const hasAccess = hasPermission(user?.role, pathname);
      if (!hasAccess) {
        router.push('/schedules');
      }
    }
  }, [pathname, isAuthenticated, router, user?.role]);

  return { user, isAuthenticated };
}
