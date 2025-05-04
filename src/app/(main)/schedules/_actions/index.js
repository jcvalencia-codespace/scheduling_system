'use server';

import TermsModel from '@/app/models/Terms';
import schedulesModel from '@/app/models/Schedules';
import mongoose from 'mongoose';

export async function getActiveTerm() {
  try {
    const term = await TermsModel.getActiveTerm();
    if (!term) {
      return { error: 'No active term found' };
    }
    console.log('Active term in action:', term); // Debug log
    return { term };
  } catch (error) {
    console.error('Error getting active term:', error);
    return { error: error.message || 'Failed to get active term' };
  }
}

export async function getScheduleFormData() {
  try {
    const [sections, faculty, subjects, rooms] = await Promise.all([
      schedulesModel.getSections(),
      schedulesModel.getFaculty(),
      schedulesModel.getSubjects(),
      schedulesModel.getRooms(),
    ]);

    // Serialize the data to handle MongoDB objects
    const serializedData = {
      sections: JSON.parse(JSON.stringify(sections || [])),
      faculty: JSON.parse(JSON.stringify(faculty || [])),
      subjects: JSON.parse(JSON.stringify(subjects || [])),
      rooms: JSON.parse(JSON.stringify(rooms || [])),
    };

    if (!sections?.length || !faculty?.length || !subjects?.length || !rooms?.length) {
      console.warn('Some data collections are empty:', {
        sectionsCount: sections?.length,
        facultyCount: faculty?.length,
        subjectsCount: subjects?.length,
        roomsCount: rooms?.length
      });
    }

    return serializedData;
  } catch (error) {
    console.error('Error fetching schedule form data:', error);
    return { error: error.message || 'Failed to fetch form data' };
  }
}

export async function createSchedule(scheduleData) {
  try {
    if (!scheduleData.userId) {
      throw new Error('User ID is required');
    }

    // Convert room IDs to ObjectIds if force flag is set
    if (scheduleData.force) {
      scheduleData.room = new mongoose.Types.ObjectId(scheduleData.room);
      if (scheduleData.pairedSchedule?.room) {
        scheduleData.pairedSchedule.room = new mongoose.Types.ObjectId(scheduleData.pairedSchedule.room);
      }
    }

    console.log('Creating schedule with data:', scheduleData);
    
    const result = await schedulesModel.createSchedule(scheduleData);
    
    // Check if result exists
    if (!result) {
      throw new Error('Failed to create schedule: No result returned');
    }
    
    // Check if there are conflicts
    if (result.conflicts) {
      console.log('Conflicts detected in server action:', result.conflicts);
      return { conflicts: result.conflicts };
    }
    
    // Check if schedule exists
    if (!result.schedule) {
      throw new Error('Failed to create schedule: No schedule in result');
    }
    
    return { schedule: JSON.parse(JSON.stringify(result.schedule)) };
  } catch (error) {
    console.error('Error creating schedule:', error);
    return { error: error.message };
  }
}

export async function updateSchedule(scheduleId, scheduleData) {
  try {
    if (!scheduleData.userId) {
      throw new Error('User ID is required');
    }
    
    // Convert IDs to ObjectIds if force flag is set
    if (scheduleData.force) {
      scheduleData.room = new mongoose.Types.ObjectId(scheduleData.room);
      scheduleData.userId = new mongoose.Types.ObjectId(scheduleData.userId);
      if (scheduleData.pairedSchedule?.room) {
        scheduleData.pairedSchedule.room = new mongoose.Types.ObjectId(scheduleData.pairedSchedule.room);
      }
    }
    
    const result = await schedulesModel.updateSchedule(scheduleId, scheduleData);
    
    // Check if there are conflicts
    if (result.conflicts) {
      return { conflicts: result.conflicts };
    }
    
    return { schedule: JSON.parse(JSON.stringify(result.schedule)) };
  } catch (error) {
    console.error('Error updating schedule:', error);
    return { error: error.message || 'Failed to update schedule' };
  }
}

export async function getSchedules(query = {}) {
  try {
    // Get active term first
    const term = await TermsModel.getActiveTerm();
    if (!term) {
      return { error: 'No active term found' };
    }
    
    // Add term filter to query and ensure it's a string
    const schedules = await schedulesModel.getSchedules({
      ...query,
      term: term.id.toString()
    });
    
    return { schedules: JSON.parse(JSON.stringify(schedules)) };
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return { error: error.message || 'Failed to fetch schedules' };
  }
}

export async function deleteSchedule(scheduleId, userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const result = await schedulesModel.deleteSchedule(scheduleId, userId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return { error: error.message || 'Failed to delete schedule' };
  }
}

export async function getAllSections() {
  try {
    const sections = await schedulesModel.getAllActiveSections();
    if (!sections) {
      throw new Error('Failed to fetch sections');
    }
    return { sections: JSON.parse(JSON.stringify(sections)) };
  } catch (error) {
    console.error('Error fetching all sections:', error);
    return { error: error.message || 'Failed to fetch sections' };
  }
}