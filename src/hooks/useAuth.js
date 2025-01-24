'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

const publicPaths = ['/login', '/forgot-password'];

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // If on a public path and user is authenticated, redirect to home
    if (publicPaths.includes(pathname) && isAuthenticated) {
      router.push('/home');
      return;
    }

    // If on a protected path and user is not authenticated, redirect to login
    if (!publicPaths.includes(pathname) && !isAuthenticated) {
      router.push('/login');
    }
  }, [pathname, isAuthenticated, router]);

  return { user, isAuthenticated };
}
