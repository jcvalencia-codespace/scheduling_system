'use server'

import AssignSubjectsModel from '@/app/models/AssignSubjects';
import TermsModel from '@/app/models/Terms';
import sectionsModel from '@/app/models/Sections';

export async function getClasses(yearLevel, userId) {
  try {
    const classes = await AssignSubjectsModel.fetchClasses(yearLevel, userId);
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

export async function getAllSubjects() {
  try {
    const subjects = await AssignSubjectsModel.fetchSubjects(); // Call without departmentId
    return subjects || [];
  } catch (error) {
    console.error('Error fetching all subjects:', error);
    return [];
  }
}

export async function getAssignments(userId = null) {
  try {
    const groupedAssignments = await AssignSubjectsModel.getGroupedAssignments(userId);
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

export async function getCoursesByDepartment(departmentId) {
  try {
    const courses = await AssignSubjectsModel.fetchCoursesByDepartment(departmentId);
    return courses || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getYearLevelsByCourse(courseId) {
  try {
    const yearLevels = await AssignSubjectsModel.fetchYearLevelsByCourse(courseId);
    return yearLevels || [];
  } catch (error) {
    console.error('Error fetching year levels:', error);
    return [];
  }
}

export async function getSectionsByCourseAndYear(courseId, yearLevel) {
  try {
    const sections = await AssignSubjectsModel.fetchSectionsByCourseAndYear(courseId, yearLevel);
    return sections || [];
  } catch (error) {
    console.error('Error fetching sections:', error);
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
      academicYear: activeTerm.academicYear,
      subjects: data.subjectAssignments.map(assignment => ({
        subjectId: assignment.subjectId,
        hours: assignment.hours
      }))
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
        subjects: data.subjectAssignments.map(assignment => ({
          subjectId: assignment.subjectId,
          hours: assignment.hours
        }))
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
        _id: activeTerm._id, // Add term ID
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

export async function getAllCourses() {
  try {
    const courses = await AssignSubjectsModel.fetchAllCourses();
    return courses || [];
  } catch (error) {
    console.error('Error fetching all courses:', error);
    return [];
  }
}

export async function getAllYearLevels() {
  try {
    const yearLevels = await AssignSubjectsModel.fetchAllYearLevels();
    return yearLevels || [];
  } catch (error) {
    console.error('Error fetching all year levels:', error);
    return [];
  }
}

export async function getAllSections() {
  try {
    const sections = await AssignSubjectsModel.fetchAllSections();
    return sections || [];
  } catch (error) {
    console.error('Error fetching all sections:', error);
    return [];
  }
}

export async function getYearLevelsByDepartment(departmentId = null) {
  try {
    const yearLevels = await sectionsModel.getYearLevelsByDepartment(departmentId);
    return yearLevels || [];
  } catch (error) {
    console.error('Error fetching year levels:', error);
    return [];
  }
}

export async function getSectionsByDepartment(departmentId = null) {
  try {
    const sections = await sectionsModel.getSectionsByDepartment(departmentId);
    return sections || [];
  } catch (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
}

export const getSubjectAssignments = async (userId = null) => {
  try {
    const assignments = await AssignSubjectsModel.fetchAssignments(userId);
    return { success: true, assignments };
  } catch (error) {
    console.error('Error fetching subject assignments:', error);
    return { success: false, assignments: [] };
  }
};

export async function getVisibleTerms() {
  try {
    const terms = await Term.find({ isVisible: true })
      .sort({ term: 1 });
    return { success: true, terms: JSON.parse(JSON.stringify(terms)) };
  } catch (error) {
    console.error('Error fetching visible terms:', error);
    return { error: 'Failed to fetch terms' };
  }
}
