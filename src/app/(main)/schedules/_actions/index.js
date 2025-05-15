'use server';

import TermsModel from '@/app/models/Terms';
import schedulesModel from '@/app/models/Schedules';
import adminHoursModel from '@/app/models/AdminHours';
import sectionsModel from '@/app/models/Sections'; // Add sectionsModel import
import mongoose from 'mongoose';
import moment from 'moment'; // Add moment import

export async function getActiveTerm() {
  try {
    const term = await TermsModel.getActiveTerm();
    if (!term) {
      throw new Error('No active term found');
    }

    // Ensure we're returning an object with term property
    return { 
      term: {
        id: term.id,
        term: term.term,
        academicYear: term.academicYear,
        startDate: term.startDate,
        endDate: term.endDate,
        status: term.status,
        isVisible: term.isVisible
      }
    };
  } catch (error) {
    console.error('Error getting active term:', error);
    throw new Error('No active term found. Please contact an administrator.');
  }
}

export async function getScheduleFormData() {
  try {
    // Get the sections with proper department filtering
    const sections = await schedulesModel.getSectionsForUser();
    const [faculty, subjects, rooms] = await Promise.all([
      schedulesModel.getFaculty(),
      schedulesModel.getSubjects(),
      schedulesModel.getRooms(),
    ]);

    console.log('Fetched sections:', sections); // Debug log

    return JSON.parse(JSON.stringify({
      sections: sections || [],
      faculty: faculty || [],
      subjects: subjects || [],
      rooms: rooms || [],
    }));
  } catch (error) {
    console.error('Error fetching schedule form data:', error);
    throw error;
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
    
    // Add term and faculty filters to query
    const schedules = await schedulesModel.getSchedules({
      ...query,
      term: term.id.toString(),
      faculty: query.faculty ? query.faculty.toString() : undefined
    });
    
    return { schedules: JSON.parse(JSON.stringify(schedules)) };
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return { error: error.message || 'Failed to fetch schedules' };
  }
}

export async function getFacultySchedules(facultyId) {
  try {
    // Get active term first
    const term = await TermsModel.getActiveTerm();
    if (!term) {
      return { error: 'No active term found' };
    }
    
    // Add term and faculty filters to query
    const schedules = await schedulesModel.getSchedules({
      term: term.id.toString(),
      faculty: facultyId
    });
    
    return { schedules: JSON.parse(JSON.stringify(schedules)) };
  } catch (error) {
    console.error('Error fetching faculty schedules:', error);
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

    // Properly serialize the sections data
    const serializedSections = JSON.parse(JSON.stringify(sections.map(section => ({
      ...section,
      _id: section._id?.toString(),
      course: section.course ? {
        ...section.course,
        _id: section.course._id?.toString(),
        department: section.course.department ? {
          ...section.course.department,
          _id: section.course.department._id?.toString()
        } : null
      } : null,
      department: section.department ? {
        ...section.department,
        _id: section.department._id?.toString()
      } : null
    }))));

    return { sections: serializedSections };
  } catch (error) {
    console.error('Error fetching all sections:', error);
    return { error: error.message || 'Failed to fetch sections' };
  }
}

export async function getFacultyLoad(facultyId, termId) {
  try {
    if (!facultyId || !termId) {
      return {
        employmentType: 'N/A',
        totalHours: 0,
        teachingHours: 0,
        adminHours: 0
      };
    }
    
    const loadData = await schedulesModel.calculateFacultyLoad(facultyId, termId);
    
    // If there's an error in the response, handle it gracefully
    if (loadData.error) {
      console.error('Faculty load calculation error:', loadData.error);
      return {
        employmentType: 'unknown',
        totalHours: 0,
        teachingHours: 0,
        adminHours: 0
      };
    }
    
    return loadData;
  } catch (error) {
    console.error('Error getting faculty load:', error);
    return {
      employmentType: 'N/A',
      totalHours: 0,
      teachingHours: 0,
      adminHours: 0
    };
  }
}

export async function getAdminHours(userId, termId) {
  try {
    // Get active term first
    const term = await TermsModel.getActiveTerm();
    if (!term) {
      return { error: 'No active term found' };
    }

    const hours = await adminHoursModel.getAdminHours(userId, term.id);
    return { hours: JSON.parse(JSON.stringify(hours)) };
  } catch (error) {
    console.error('Error fetching admin hours:', error);
    return { error: 'Failed to fetch admin hours' };
  }
}

export async function saveAdminHours(userId, termId, slots, creatorId, role) {
  try {
    // Get active term if termId not provided
    if (!termId) {
      const term = await TermsModel.getActiveTerm();
      if (!term) {
        return { error: 'No active term found' };
      }
      termId = term.id;
    }

    console.log('Saving admin hours with termId:', termId); // Debug log

    const result = await adminHoursModel.saveAdminHours(
      userId,
      termId,
      slots,
      creatorId,
      role
    );
    return { success: true, hours: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    console.error('Error saving admin hours:', error);
    return { error: error.message };
  }
}

export async function approveAdminHours(adminHoursId, slotId, approverId, approved, rejectionReason) {
  try {
    const result = await adminHoursModel.approveAdminHours(
      adminHoursId, 
      slotId,
      approverId, 
      approved, 
      rejectionReason
    );

    // The notification is now handled in the model layer
    return { success: true, hours: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    console.error('Error updating admin hours approval:', error);
    return { error: error.message };
  }
}

export async function cancelAdminHours(adminHoursId, slotId) {
  try {
    if (!adminHoursId || !slotId) {
      throw new Error('Admin hours ID and slot ID are required');
    }

    const response = await adminHoursModel.cancelAdminHours(adminHoursId, slotId);

    if (!response) {
      throw new Error('Failed to cancel admin hours');
    }

    return { 
      success: true, 
      message: 'Admin hours slot cancelled successfully',
      hours: JSON.parse(JSON.stringify(response))
    };
  } catch (error) {
    console.error('Error in cancelAdminHours action:', error);
    return { 
      error: error.message || 'Failed to cancel admin hours',
      details: error.toString()
    };
  }
}

export async function getFullTimeUsers() {
  try {
    const users = await adminHoursModel.getFullTimeUsers();
    return { users: JSON.parse(JSON.stringify(users)) };
  } catch (error) {
    console.error('Error fetching full-time users:', error);
    return { error: error.message };
  }
}

export async function getAdminHourRequests(filter = 'pending', termId) {
  try {
    // Enhanced termId validation
    if (!termId || typeof termId !== 'string') {
      console.error('Invalid or missing termId:', termId);
      throw new Error('Valid Term ID is required');
    }

    // Ensure termId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(termId)) {
      console.error('Invalid ObjectId format for termId:', termId);
      throw new Error('Invalid Term ID format');
    }

    const requests = await adminHoursModel.getRequests(filter, termId);
    return { requests: JSON.parse(JSON.stringify(requests)) };
  } catch (error) {
    console.error('Error fetching admin hour requests:', error);
    return { error: error.message };
  }
}

export async function editAdminHours(adminHoursId, slotId, updatedData) {
  try {
    const result = await adminHoursModel.editAdminHours(
      adminHoursId,
      slotId,
      updatedData
    );
    
    return { success: true, hours: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    console.error('Error editing admin hours:', error);
    return { error: error.message };
  }
}

export async function deleteAdminHours(adminHoursId, slotId) {
  try {
    if (!adminHoursId || !slotId) {
      throw new Error('Admin hours ID and slot ID are required');
    }

    const response = await adminHoursModel.deleteAdminHours(adminHoursId, slotId);

    if (!response) {
      throw new Error('Failed to delete admin hours');
    }

    return { 
      success: true, 
      message: 'Admin hours slot deleted successfully',
      hours: JSON.parse(JSON.stringify(response))
    };
  } catch (error) {
    console.error('Error in deleteAdminHours action:', error);
    return { 
      error: error.message || 'Failed to delete admin hours',
      details: error.toString()
    };
  }
}

export async function editApprovedAdminHours(adminHoursId, slotId, updatedData) {
  try {
    if (!adminHoursId || !slotId) {
      throw new Error('Admin hours ID and slot ID are required');
    }

    console.log('Editing approved admin hours with:', { adminHoursId, slotId, updatedData });

    const result = await adminHoursModel.editApprovedAdminHours(
      adminHoursId,
      slotId,
      updatedData
    );
    
    return { success: true, hours: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    console.error('Error editing approved admin hours:', error);
    return { error: error.message || 'Failed to edit approved admin hours' };
  }
}