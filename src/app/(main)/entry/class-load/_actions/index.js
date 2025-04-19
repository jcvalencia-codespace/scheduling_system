'use server'

import AssignSubjectsModel from '@/app/models/AssignSubjects';
import TermsModel from '@/app/models/Terms';

export async function getClasses(yearLevel) {
  try {
    const classes = await AssignSubjectsModel.fetchClasses(yearLevel);
    return classes || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
}

export async function getSubjects(departmentId = null) {
  try {
    const subjects = await AssignSubjectsModel.fetchSubjects(departmentId);
    return subjects || [];
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

export async function getAssignments() {
  try {
    const groupedAssignments = await AssignSubjectsModel.getGroupedAssignments();
    return Object.values(groupedAssignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    if (error.message === 'No active term found') {
      return [];
    }
    return [];
  }
}

export async function getDepartments() {
  try {
    const departments = await AssignSubjectsModel.fetchDepartments();
    return departments || [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

export async function deleteAssignment(id, userId) {
  try {
    if (!userId) throw new Error('User not authenticated');
    await AssignSubjectsModel.deleteAssignmentById(id, userId);
    return { success: true, message: 'Assignment deleted successfully' };
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return { success: false, message: error.message || 'Failed to delete assignment' };
  }
}

export async function updateAssignment(id, data, userId) {
  try {
    if (!userId) throw new Error('User not authenticated');
    const activeTerm = await AssignSubjectsModel.getActiveTerm();
    if (!activeTerm._id) throw new Error('No active term found');

    await AssignSubjectsModel.updateAssignmentById(id, {
      ...data,
      termId: activeTerm._id,
      academicYear: activeTerm.academicYear
    }, userId);
    return { success: true, message: 'Assignment updated successfully' };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to update assignment' };
  }
}

export async function createAssignment(data, userId) {
  try {
    if (!userId) throw new Error('User not authenticated');
    const activeTerm = await AssignSubjectsModel.getActiveTerm();
    if (!activeTerm._id) throw new Error('No active term found');
    
    for (const classId of data.classes) {
      await AssignSubjectsModel.updateOrCreateAssignment(classId, {
        yearLevel: data.yearLevel.replace(' Year', ''),
        term: Number(data.term),
        termId: activeTerm._id,
        academicYear: activeTerm.academicYear,
        subjects: data.subjects
      }, userId);
    }
    return { success: true, message: 'Subjects assigned successfully' };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to create assignment' };
  }
}

export async function getActiveTerm() {
  try {
    const activeTerm = await AssignSubjectsModel.getActiveTerm();
    return {
      success: true,
      term: {
        sy: activeTerm.academicYear,
        term: activeTerm.term.replace('Term ', ''),
        termName: activeTerm.term
      }
    };
  } catch (error) {
    console.error('Error fetching active term:', error);
    const currentYear = new Date().getFullYear();
    return {
      success: false,
      term: {
        sy: `${currentYear}-${currentYear + 1}`,
        term: 1,
        termName: 'Term 1'
      }
    };
  }
}

export async function getTermDetails(termNumbers) {
  try {
    const terms = await TermsModel.getTermsByNumbers(termNumbers);
    return {
      success: true,
      terms: terms
    };
  } catch (error) {
    console.error('Error fetching terms:', error);
    return {
      success: false,
      terms: []
    };
  }
}
