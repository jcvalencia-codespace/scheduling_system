'use server';

import { revalidatePath } from 'next/cache';
import archiveModel from '@/app/models/Archive';
import connectDB from '../../../../../../lib/mongo';

export async function getUpdateHistory() {
  try {
    // Ensure database connection
    await connectDB();
    
    const history = await archiveModel.getUpdateHistory();
    
    if (!Array.isArray(history)) {
      throw new Error('Invalid history data format');
    }

    // Revalidate the archive page
    revalidatePath('/activity-logs/archive');
    
    return history;
  } catch (error) {
    console.error('Server error in getUpdateHistory:', error);
    throw new Error(error.message || 'Failed to fetch update history');
  }
}

export async function getSubjectHistory() {
  try {
    await connectDB();
    const history = await archiveModel.getSubjectHistory();
    
    if (!Array.isArray(history)) {
      throw new Error('Invalid history data format');
    }

    revalidatePath('/activity-logs/archive');
    return history;
  } catch (error) {
    console.error('Server error in getSubjectHistory:', error);
    throw new Error(error.message || 'Failed to fetch subject history');
  }
}

export async function getSectionHistory() {
  try {
    await connectDB();
    const history = await archiveModel.getSectionHistory();
    
    if (!Array.isArray(history)) {
      throw new Error('Invalid history data format');
    }

    revalidatePath('/activity-logs/archive');
    return history;
  } catch (error) {
    console.error('Server error in getSectionHistory:', error);
    throw new Error(error.message || 'Failed to fetch section history');
  }
}

export async function getRoomHistory() {
  try {
    await connectDB();
    const history = await archiveModel.getRoomHistory();
    
    if (!Array.isArray(history)) {
      throw new Error('Invalid history data format');
    }

    revalidatePath('/activity-logs/archive');
    return history;
  } catch (error) {
    console.error('Server error in getRoomHistory:', error);
    throw new Error(error.message || 'Failed to fetch room history');
  }
}
