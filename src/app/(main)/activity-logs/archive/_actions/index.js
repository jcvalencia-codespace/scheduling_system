'use server';

import { revalidatePath } from 'next/cache';
import archiveModel from '@/app/models/Archive';
import termsModel from '@/app/models/Terms';
import connectDB from '../../../../../../lib/mongo';

async function getActiveTerm() {
  const term = await termsModel.getActiveTerm();
  if (!term) {
    throw new Error('No active term found');
  }
  return term;
}

export async function getUpdateHistory() {
  try {
    await connectDB();
    const activeTerm = await getActiveTerm();
    
    const history = await archiveModel.getUpdateHistory(
      activeTerm.startDate,
      activeTerm.endDate
    );
    
    if (!Array.isArray(history)) {
      throw new Error('Invalid history data format');
    }

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
    const activeTerm = await getActiveTerm();
    
    const history = await archiveModel.getSubjectHistory(
      activeTerm.startDate,
      activeTerm.endDate
    );
    
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
    const activeTerm = await getActiveTerm();
    
    const history = await archiveModel.getSectionHistory(
      activeTerm.startDate,
      activeTerm.endDate
    );
    
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
    const activeTerm = await getActiveTerm();
    
    const history = await archiveModel.getRoomHistory(
      activeTerm.startDate,
      activeTerm.endDate
    );
    
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
