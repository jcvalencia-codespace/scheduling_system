'use server';

import { revalidatePath } from 'next/cache';
import archiveModel from '@/app/models/Archive';
import termsModel from '@/app/models/Terms';
import connectDB from '../../../../../../lib/mongo';

// Add this helper function at the top
const serializeData = (data) => {
  if (!data) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }

  const serialized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      if (value instanceof Buffer) {
        serialized[key] = value.toString('hex');
      } else if (value._bsontype === 'ObjectID') {
        serialized[key] = value.toString();
      } else if (value.toJSON) {
        serialized[key] = value.toJSON();
      } else {
        serialized[key] = serializeData(value);
      }
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
};

export async function getActiveTerm() {
  try {
    await connectDB();
    const term = await termsModel.getActiveTerm();
    
    if (!term) {
      throw new Error('No active term found');
    }

    return serializeData(term);
  } catch (error) {
    console.error('Server error in getActiveTerm:', error);
    throw new Error(error.message || 'Failed to fetch active term');
  }
}

export async function getUpdateHistory(startDate = null, endDate = null, academicYear = null, courseId = null) {
  try {
    const history = await archiveModel.getUpdateHistory(startDate, endDate, academicYear, courseId);
    return serializeData(history);
  } catch (error) {
    console.error('Error in getUpdateHistory action:', error);
    return { error: 'Failed to fetch update history' };
  }
}

export async function getSubjectHistory() {
  try {
    await connectDB();
    const activeTerm = await getActiveTerm();
    
    const history = await archiveModel.getSubjectHistory(
      activeTerm.startDate,
      activeTerm.endDate,
      activeTerm.academicYear
    );
    
    if (!Array.isArray(history)) {
      throw new Error('Invalid history data format');
    }

    revalidatePath('/activity-logs/archive');
    return serializeData(history);
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
      activeTerm.endDate,
      activeTerm.academicYear
    );
    
    if (!Array.isArray(history)) {
      throw new Error('Invalid history data format');
    }

    revalidatePath('/activity-logs/archive');
    return serializeData(history);
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
      activeTerm.endDate,
      activeTerm.academicYear
    );
    
    if (!Array.isArray(history)) {
      throw new Error('Invalid history data format');
    }

    revalidatePath('/activity-logs/archive');
    return serializeData(history);
  } catch (error) {
    console.error('Server error in getRoomHistory:', error);
    throw new Error(error.message || 'Failed to fetch room history');
  }
}
