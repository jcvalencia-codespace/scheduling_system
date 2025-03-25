import mongoose from 'mongoose';
import { SectionSchema, SubjectSchema, AssignSubjectsSchema } from '../../../db/schema';
const { Schema } = mongoose;

const Section = mongoose.models.Section || mongoose.model('Section', SectionSchema);
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

// Define methods before creating the model
const AssignSubjectsModel = mongoose.models.AssignSubjects || mongoose.model('AssignSubjects', AssignSubjectsSchema);

// Add static methods to the model
AssignSubjectsModel.fetchClasses = async function(yearLevel) {
  try {
    // Remove the word "Year" if it exists in the yearLevel string
    const formattedYearLevel = yearLevel.replace(' Year', '');
    
    console.log('Querying with yearLevel:', formattedYearLevel + ' Year'); // Debug log
    
    // Use the Section model directly with proper query
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

AssignSubjectsModel.checkExistingAssignments = async function(classId, subjects, term) {
  try {
    const existingAssignment = await this.findOne({
      classId: classId,
      term: Number(term)
    }).populate('subjects', 'subjectCode subjectName');

    if (existingAssignment) {
      const duplicateSubjects = existingAssignment.subjects
        .filter(subject => subjects.includes(subject._id.toString()))
        .map(subject => `${subject.subjectCode} - ${subject.subjectName}`);

      return {
        hasDuplicates: duplicateSubjects.length > 0,
        duplicateSubjects
      };
    }

    return { hasDuplicates: false };
  } catch (error) {
    console.error('Error checking existing assignments:', error);
    throw new Error('Failed to check for existing assignments');
  }
};

export default AssignSubjectsModel;
