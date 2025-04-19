'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { pusherClient } from '@/utils/pusher';
import { getUserNotifications, markNotificationAsRead, deleteAllNotifications } from '../(main)/schedules/_actions/notifications';
import useAuthStore from '@/store/useAuthStore';

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?._id) return;

    // Fetch existing notifications
    const fetchNotifications = async () => {
      const { notifications: userNotifications, error } = await getUserNotifications(user._id);
      if (!error) {
        setNotifications(userNotifications);
      }
    };

    fetchNotifications();

    // Subscribe to Pusher channel
    const channel = pusherClient.subscribe(`user-${user._id}`);
    
    channel.bind('notification', (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      pusherClient.unsubscribe(`user-${user._id}`);
    };
  }, [user?._id]);

  const markAsRead = async (notificationId) => {
    const { error } = await markNotificationAsRead(notificationId);
    if (!error) {
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
    }
  };

  // Update the markAllAsRead function
  const markAllAsRead = async () => {
    if (!user?._id) return;
    
    // Update all unread notifications
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    for (const notification of unreadNotifications) {
      const { error } = await markNotificationAsRead(notification._id);
      if (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Update local state
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  // Add clearAll function
  const clearAll = async () => {
    if (!user?._id) return;
    
    const { error } = await deleteAllNotifications(user._id);
    if (!error) {
      setNotifications([]);
    }
  };

  return (
    <NotificationsContext.Provider value={{ 
      notifications,
      markAsRead,
      markAllAsRead,
      clearAll,
      unreadCount: notifications.filter(n => !n.isRead).length
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);