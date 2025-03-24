import mongoose from 'mongoose';
import { SectionSchema, SubjectSchema, AssignSubjectsSchema } from '../../../db/schema';
const { Schema } = mongoose;

const Section = mongoose.models.Section || mongoose.model('Section', SectionSchema);
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

// Static methods for fetching data
AssignSubjectsSchema.statics.fetchClasses = async function(yearLevel) {
  try {
    const classes = await Section.find({ 
      yearLevel: `${yearLevel} Year`,
      isActive: true 
    })
    .select('_id sectionName courseCode departmentCode')
    .lean();
    
    // Convert MongoDB _id to string
    return classes.map(cls => ({
      ...cls,
      _id: cls._id.toString()
    }));
  } catch (error) {
    console.error('Error in fetchClasses:', error);
    throw new Error('Failed to fetch classes');
  }
};

AssignSubjectsSchema.statics.fetchSubjects = async function(term) {
  try {
    const subjects = await Subject.find({ 
      term: Number(term),
      isActive: true 
    })
    .select('subjectCode subjectName')
    .lean();
    
    // Convert MongoDB _id to string
    return subjects.map(subject => ({
      ...subject,
      _id: subject._id.toString()
    }));
  } catch (error) {
    console.error('Error in fetchSubjects:', error); // Debug log
    throw new Error('Failed to fetch subjects');
  }
};

export default mongoose.models.AssignSubjects || mongoose.model('AssignSubjects', AssignSubjectsSchema);
