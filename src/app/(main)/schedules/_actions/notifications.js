'use server';

import { pusherServer } from '@/utils/pusher';
import mongoose from 'mongoose';
import { NotificationSchema } from '../../../../../db/schema';
import { sendScheduleNotificationEmail } from './emailNotifications';

const Notifications = mongoose.models.Notifications || mongoose.model('Notifications', NotificationSchema);

export async function createNotification(data) {
  try {
    const notification = await Notifications.create(data);
    
    // Trigger Pusher event with serialized data
    const serializedData = JSON.parse(JSON.stringify({
      ...data,
      _id: notification._id
    }));
    
    await pusherServer.trigger(`user-${data.userId}`, 'notification', serializedData);

    // Get user data for email notification
    const user = await mongoose.model('Users').findById(data.userId);
    if (user && user.email) {
      await sendScheduleNotificationEmail(user, serializedData);
    }

    return { 
      success: true, 
      notification: JSON.parse(JSON.stringify(notification))
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { error: error.message };
  }
}

export async function getUserNotifications(userId) {
  try {
    const notifications = await Notifications.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return { 
      notifications: JSON.parse(JSON.stringify(notifications))
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { error: error.message };
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const notification = await Notifications.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    
    return { 
      success: true, 
      notification: JSON.parse(JSON.stringify(notification))
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { error: error.message };
  }
}

// Add this new function
export async function deleteAllNotifications(userId) {
  try {
    const result = await Notifications.deleteMany({ userId });
    
    return { 
      success: true, 
      result: JSON.parse(JSON.stringify(result))
    };
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return { error: error.message };
  }
}