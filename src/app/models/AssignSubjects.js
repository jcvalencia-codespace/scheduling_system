import mongoose from 'mongoose';
import { SectionSchema, SubjectSchema, AssignSubjectsSchema } from '../../../db/schema';
const { Schema } = mongoose;

const Section = mongoose.models.Section || mongoose.model('Section', SectionSchema);
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

// Define the model first
const AssignSubjectsModel = mongoose.models.AssignSubjects || mongoose.model('AssignSubjects', AssignSubjectsSchema);

// Add static methods to the model
AssignSubjectsModel.fetchClasses = async function(yearLevel) {
  try {
    const formattedYearLevel = yearLevel.replace(' Year', '');
    
    console.log('Querying with yearLevel:', formattedYearLevel + ' Year'); // Debug log
    
    const classes = await Section.find({ 
      yearLevel: formattedYearLevel + ' Year',
      isActive: true 
    })
    .select('_id sectionName courseCode departmentCode yearLevel')
    .lean();
    
    console.log('Found classes:', classes); // Debug log
    return classes;
  } catch (error) {
    console.error('Error in fetchClasses:', error);
    throw new Error('Failed to fetch classes');
  }
};

AssignSubjectsModel.fetchSubjects = async function(term) {
  try {
    const subjects = await this.model('Subject').find({ 
      term: Number(term),
      isActive: true 
    })
    .select('subjectCode subjectName')
    .lean();
    
    return subjects.map(subject => ({
      ...subject,
      _id: subject._id.toString()
    }));
  } catch (error) {
    throw new Error('Failed to fetch subjects');
  }
};

AssignSubjectsModel.checkExistingAssignments = async function(classId, subjects, term, currentAssignmentId = null) {
  try {
    // Find existing assignments for the class and term, excluding current assignment if updating
    const query = {
      classId: classId,
      term: Number(term)
    };
    if (currentAssignmentId) {
      query._id = { $ne: currentAssignmentId };
    }

    const existingAssignments = await this.find(query)
      .populate('subjects', 'subjectCode subjectName');

    if (!existingAssignments.length) {
      return { hasDuplicates: false, duplicateSubjects: [] };
    }

    const assignedSubjectIds = existingAssignments.reduce((acc, assignment) => {
      return [...acc, ...assignment.subjects.map(s => s._id.toString())];
    }, []);

    const duplicateSubjects = subjects.filter(subjectId => 
      assignedSubjectIds.includes(subjectId.toString())
    );

    const subjectDetails = await Subject.find({
      _id: { $in: duplicateSubjects }
    }).select('subjectCode');

    return {
      hasDuplicates: duplicateSubjects.length > 0,
      duplicateSubjects: subjectDetails.map(s => s.subjectCode)
    };
  } catch (error) {
    console.error('Error checking existing assignments:', error);
    throw new Error('Failed to check existing assignments');
  }
};

AssignSubjectsModel.updateOrCreateAssignment = async function(classId, data) {
  try {
    const existingAssignment = await this.findOne({
      classId: classId,
      term: Number(data.term)
    });

    if (existingAssignment) {
      const updatedSubjects = [...new Set([
        ...existingAssignment.subjects.map(s => s.toString()),
        ...data.subjects
      ])];

      await existingAssignment.updateOne({
        subjects: updatedSubjects
      });

      return existingAssignment;
    } else {
      return await this.create({
        yearLevel: data.yearLevel,
        term: Number(data.term),
        classId: classId,
        subjects: data.subjects
      });
    }
  } catch (error) {
    console.error('Error updating/creating assignment:', error);
    throw new Error('Failed to update/create assignment');
  }
};

export default AssignSubjectsModel;
