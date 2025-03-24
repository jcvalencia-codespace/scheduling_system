'use server';

import termsModel from '@/app/models/Terms';
import schedulesModel from '@/app/models/Schedules';
import sectionsModel from '@/app/models/Sections';
import usersModel from '@/app/models/Users';
import subjectsModel from '@/app/models/Subjects';
import roomsModel from '@/app/models/Rooms';

export async function getActiveTerm() {
  try {
    const term = await termsModel.getActiveTerm();
    if (!term) {
      return { error: 'No active term found' };
    }
    return { term };
  } catch (error) {
    console.error('Error getting active term:', error);
    return { error: error.message || 'Failed to get active term' };
  }
}

export async function createSchedule(scheduleData) {
  try {
    console.log('Creating schedule with data:', scheduleData);
    
    // Validate required fields
    if (!scheduleData.termId) {
      throw new Error('Term ID is required');
    }

    const schedule = await schedulesModel.createSchedule(scheduleData);
    return { schedule };
  } catch (error) {
    console.error('Error creating schedule:', error);
    return { 
      error: error.message || 'Failed to create schedule',
      details: error
    };
  }
}

export async function getSchedules(termId) {
  try {
    const schedules = await schedulesModel.getAllSchedules(termId);
    return { schedules };
  } catch (error) {
    console.error('Error getting schedules:', error);
    return { error: error.message || 'Failed to get schedules' };
  }
}

export async function updateSchedule(scheduleId, updateData) {
  try {
    const schedule = await schedulesModel.updateSchedule(scheduleId, updateData);
    return { schedule };
  } catch (error) {
    console.error('Error updating schedule:', error);
    return { error: error.message || 'Failed to update schedule' };
  }
}

export async function deleteSchedule(scheduleId) {
  try {
    await schedulesModel.deleteSchedule(scheduleId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return { error: error.message || 'Failed to delete schedule' };
  }
}

export async function getFaculty() {
  try {
    console.log('Fetching faculty...');
    const faculty = await usersModel.getFacultyUsers();
    console.log('Raw faculty data:', faculty);
    
    if (!faculty || faculty.length === 0) {
      console.log('No faculty found in database');
    }
    
    return { faculty };
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return { error: error.message };
  }
}

export async function getSubjects() {
  try {
    const subjects = await subjectsModel.getAllSubjects();
    if (!subjects) {
      throw new Error('No subjects found');
    }
    return { subjects };
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return { error: error.message };
  }
}

export async function getSections() {
  try {
    const sections = await sectionsModel.getAllSections();
    if (!sections) {
      throw new Error('No sections found');
    }
    return { sections };
  } catch (error) {
    console.error('Error fetching sections:', error);
    return { error: error.message };
  }
}

export async function getRooms() {
  try {
    const rooms = await roomsModel.getAllRooms();
    if (!rooms) {
      throw new Error('No rooms found');
    }
    return { rooms };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return { error: error.message };
  }
}
