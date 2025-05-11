'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { getAccessSettings } from '../(main)/settings/_actions';

export function useAccessSettings() {
  const { user } = useAuthStore();
  const [showMultipleSections, setShowMultipleSections] = useState(true);
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      if (user && (user.role === 'Program Chair' || user.role === 'Dean')) {
        try {
          const response = await getAccessSettings(user.role);
          if (response.success && response.data) {
            setShowMultipleSections(response.data.showMultipleSections ?? true);
            setShowFacultyDropdown(response.data.showFacultyDropdown ?? true);
          }
        } catch (error) {
          console.error('Error fetching access settings:', error);
        }
      }
    }

    fetchSettings();
  }, [user]);

  return {
    isMultipleSectionsEnabled: showMultipleSections,
    isFacultyDropdownEnabled: showFacultyDropdown,
  };
}
