'use server'

import AssignSubjectsModel from '@/app/models/AssignSubjects';

export async function getClasses(yearLevel) {
  try {
    const formattedYearLevel = yearLevel.replace(' Year', '');
    console.log('Getting classes for yearLevel:', formattedYearLevel);
    const classes = await AssignSubjectsModel.fetchClasses(formattedYearLevel);
    
    const formattedClasses = classes.map(cls => ({
      ...cls,
      _id: cls._id.toString()
    }));
    
    return formattedClasses;
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
}

export async function getSubjects(term) {
  const subjects = await AssignSubjectsModel.fetchSubjects(term);
  return JSON.parse(JSON.stringify(subjects)); // Ensure complete serialization
}

export async function createAssignment(data) {
  try {
    for (const classId of data.classes) {
      const validation = await AssignSubjectsModel.checkExistingAssignments(
        classId,
        data.subjects,
        data.term
      );

      if (validation.hasDuplicates) {
        return { 
          success: false, 
          message: `Duplicate subjects found for this section: ${validation.duplicateSubjects.join(', ')}` 
        };
      }
    }

    const assignments = data.classes.map(classId => ({
      yearLevel: data.yearLevel.replace(' Year', ''),
      term: Number(data.term),
      classId,
      subjects: data.subjects
    }));

    await AssignSubjectsModel.create(assignments);
    return { success: true, message: 'Subjects assigned successfully' };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to create assignment'
    };
  }
}

export async function getAssignments() {
  try {
    const assignments = await AssignSubjectsModel.find()
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
    await AssignSubjectsModel.findByIdAndDelete(id);
    return { success: true, message: 'Assignment deleted successfully' };
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return { success: false, message: 'Failed to delete assignment' };
  }
}

export async function updateAssignment(id, data) {
  try {
    const validation = await AssignSubjectsModel.checkExistingAssignments(
      data.classes[0],
      data.subjects,
      data.term
    );

    if (validation.hasDuplicates) {
      return { 
        success: false, 
        message: `Some subjects are already assigned to this section: ${validation.duplicateSubjects.join(', ')}` 
      };
    }

    await AssignSubjectsModel.findByIdAndUpdate(
      id,
      {
        yearLevel: data.yearLevel.replace(' Year', ''),
        term: Number(data.term),
        classId: data.classes[0],
        subjects: data.subjects
      },
      { new: true }
    );
    return { success: true, message: 'Assignment updated successfully' };
  } catch (error) {
    console.error('Error updating assignment:', error);
    return { success: false, message: 'Failed to update assignment' };
  }
}
