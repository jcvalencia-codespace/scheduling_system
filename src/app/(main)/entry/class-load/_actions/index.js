'use server'

import AssignSubjects from '@/app/models/AssignSubjects';

export async function getClasses(yearLevel) {
  const classes = await AssignSubjects.fetchClasses(yearLevel);
  return JSON.parse(JSON.stringify(classes)); // Ensure complete serialization
}

export async function getSubjects(term) {
  const subjects = await AssignSubjects.fetchSubjects(term);
  return JSON.parse(JSON.stringify(subjects)); // Ensure complete serialization
}

export async function createAssignment(data) {
  try {
    // Create multiple assignments if multiple classes are selected
    const assignments = data.classes.map(classId => ({
      yearLevel: data.yearLevel.replace(' Year', ''), // Remove 'Year' suffix
      term: Number(data.term),
      classId,
      subjects: data.subjects
    }));

    const result = await AssignSubjects.create(assignments);
    return { success: true, message: 'Subjects assigned successfully' };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return { success: false, message: 'Failed to assign subjects' };
  }
}

export async function getAssignments() {
  try {
    const assignments = await AssignSubjects.find()
      .populate('classId', 'sectionName courseCode')
      .populate('subjects', 'subjectCode subjectName')
      .lean();

    return JSON.parse(JSON.stringify(assignments));
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
}

export async function deleteAssignment(id) {
  try {
    await AssignSubjects.findByIdAndDelete(id);
    return { success: true, message: 'Assignment deleted successfully' };
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return { success: false, message: 'Failed to delete assignment' };
  }
}

export async function updateAssignment(id, data) {
  try {
    // Don't take just the first class, update with all selected classes
    await AssignSubjects.findByIdAndUpdate(
      id,
      {
        yearLevel: data.yearLevel.replace(' Year', ''),
        term: Number(data.term),
        classId: data.classes[0], // For now, keep first class as we're editing single assignment
        subjects: data.subjects // Keep all selected subjects
      },
      { new: true }
    );
    return { success: true, message: 'Assignment updated successfully' };
  } catch (error) {
    console.error('Error updating assignment:', error);
    return { success: false, message: 'Failed to update assignment' };
  }
}
