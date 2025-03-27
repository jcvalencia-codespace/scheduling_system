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
      // Check for existing assignments
      const validation = await AssignSubjectsModel.checkExistingAssignments(
        classId,
        data.subjects,
        data.term
      );

      if (validation.hasDuplicates) {
        return { 
          success: false, 
          message: `Some subjects are already assigned to this section: ${validation.duplicateSubjects.join(', ')}` 
        };
      }

      // If no duplicates, proceed with creation/update
      await AssignSubjectsModel.updateOrCreateAssignment(classId, {
        yearLevel: data.yearLevel.replace(' Year', ''),
        term: Number(data.term),
        subjects: data.subjects
      });
    }

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

    // Serialize assignments and handle _id conversion
    const serializedAssignments = assignments.map(assignment => ({
      ...assignment,
      _id: assignment._id.toString(),
      classId: {
        ...assignment.classId,
        _id: assignment.classId._id.toString()
      },
      subjects: assignment.subjects.map(subject => ({
        ...subject,
        _id: subject._id.toString()
      }))
    }));

    // Group assignments by classId
    const groupedAssignments = serializedAssignments.reduce((acc, curr) => {
      const key = curr.classId._id;
      if (!acc[key]) {
        acc[key] = {
          ...curr,
          allSubjects: [{ term: curr.term, subjects: curr.subjects }]
        };
      } else {
        acc[key].allSubjects.push({ term: curr.term, subjects: curr.subjects });
      }
      return acc;
    }, {});

    return Object.values(groupedAssignments);
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
    // Get current assignment to check existing subjects
    const currentAssignment = await AssignSubjectsModel.findById(id);
    if (!currentAssignment) {
      return { success: false, message: 'Assignment not found' };
    }

    // Check for existing assignments, excluding current assignment
    const validation = await AssignSubjectsModel.checkExistingAssignments(
      data.classes[0],
      data.subjects,
      data.term,
      id
    );

    if (validation.hasDuplicates) {
      return { 
        success: false, 
        message: `Some subjects are already assigned to this section: ${validation.duplicateSubjects.join(', ')}` 
      };
    }

    // Combine current subjects with new subjects if they weren't deselected
    const currentSubjects = currentAssignment.subjects.map(s => s.toString());
    const subjectsToKeep = currentSubjects.filter(subjectId => 
      !data.subjects.includes(subjectId)
    );
    const updatedSubjects = [...new Set([...subjectsToKeep, ...data.subjects])];

    // Update the assignment with combined subjects
    await AssignSubjectsModel.findByIdAndUpdate(
      id,
      {
        yearLevel: data.yearLevel.replace(' Year', ''),
        term: Number(data.term),
        classId: data.classes[0],
        subjects: updatedSubjects
      },
      { new: true }
    );
    
    return { success: true, message: 'Assignment updated successfully' };
  } catch (error) {
    console.error('Error updating assignment:', error);
    return { success: false, message: 'Failed to update assignment' };
  }
}
