import mongoose from 'mongoose';
import { SectionSchema, SubjectSchema, AssignSubjectsSchema, CourseSchema, DepartmentSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';

class AssignSubjectsModel {
  constructor() {
    this.models = {
      Subject: null,
      Section: null,
      Course: null,
      Department: null,
      AssignSubjects: null
    };
  }

  async initializeModels() {
    try {
      await connectDB();

      // Initialize models in the correct order (dependencies first)
      this.models.Department = mongoose.models.Departments || 
        mongoose.model('Departments', DepartmentSchema);

      this.models.Course = mongoose.models.Courses || 
        mongoose.model('Courses', CourseSchema);

      this.models.Subject = mongoose.models.Subjects || 
        mongoose.model('Subjects', SubjectSchema);

      // Important: Register Section model with 's' to match the reference
      this.models.Section = mongoose.models.Sections || 
        mongoose.model('Sections', SectionSchema);

      // Finally, register AssignSubjects model
      this.models.AssignSubjects = mongoose.models.AssignSubjects || 
        mongoose.model('AssignSubjects', AssignSubjectsSchema);

      return true;
    } catch (error) {
      console.error('Error initializing models:', error);
      throw error;
    }
  }

  async fetchClasses(yearLevel) {
    try {
      await this.initializeModels();
      const formattedYearLevel = yearLevel.replace(' Year', '');
      
      const classes = await this.models.Section.find({ 
        yearLevel: formattedYearLevel + ' Year',
        isActive: true 
      })
      .populate({
        path: 'course',
        select: 'courseCode courseTitle department',
        populate: {
          path: 'department',
          select: 'departmentCode departmentName'
        }
      })
      .select('_id sectionName course yearLevel')
      .lean();

      return classes.map(cls => ({
        ...cls,
        _id: cls._id.toString(),
        courseCode: cls.course?.courseCode || '',
        courseTitle: cls.course?.courseTitle || '',
        course: cls.course ? {
          ...cls.course,
          _id: cls.course._id.toString(),
          department: cls.course.department ? {
            ...cls.course.department,
            _id: cls.course.department._id.toString()
          } : null
        } : null
      }));
    } catch (error) {
      console.error('Error in fetchClasses:', error);
      throw error;
    }
  }

  async fetchSubjects(departmentId = null) {
    try {
      await this.initializeModels();
      
      let query = { isActive: true };
      if (departmentId) {
        const courses = await this.models.Course.find({ 
          department: departmentId,
          isActive: true 
        });
        query.department = departmentId; // Filter by department directly
      }

      const subjects = await this.models.Subject.find(query)
        .populate({
          path: 'department',
          select: 'departmentCode departmentName'
        })
        .select('subjectCode subjectName lectureHours labHours department')
        .lean();

      if (!subjects || subjects.length === 0) {
        console.log('No subjects found for department:', departmentId);
        return [];
      }

      return subjects.map(subject => ({
        ...subject,
        _id: subject._id.toString(),
        department: subject.department ? {
          ...subject.department,
          _id: subject.department._id.toString()
        } : null
      }));
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  }

  async fetchAssignments() {
    try {
      await this.initializeModels();
      console.log('Models initialized, fetching assignments...');
      
      const assignments = await this.models.AssignSubjects.find()
        .populate({
          path: 'classId',
          model: 'Sections',
          select: 'sectionName course yearLevel',
          populate: {
            path: 'course',
            model: 'Courses',
            select: 'courseCode courseTitle department',
            populate: {
              path: 'department',
              model: 'Departments',
              select: 'departmentCode departmentName'
            }
          }
        })
        .populate({
          path: 'subjects.subject',
          model: 'Subjects',
          select: 'subjectCode subjectName'
        })
        .lean();

      return assignments.map(assignment => ({
        _id: assignment._id.toString(),
        yearLevel: assignment.yearLevel,
        classId: assignment.classId ? {
          _id: assignment.classId._id.toString(),
          sectionName: assignment.classId.sectionName,
          course: assignment.classId.course ? {
            _id: assignment.classId.course._id.toString(),
            courseCode: assignment.classId.course.courseCode,
            courseTitle: assignment.classId.course.courseTitle,
            department: assignment.classId.course.department ? {
              _id: assignment.classId.course.department._id.toString(),
              departmentCode: assignment.classId.course.department.departmentCode,
              departmentName: assignment.classId.course.department.departmentName
            } : null
          } : null
        } : null,
        subjects: assignment.subjects.map(subj => ({
          _id: subj._id.toString(),
          term: subj.term,
          subject: subj.subject ? {
            _id: subj.subject._id.toString(),
            subjectCode: subj.subject.subjectCode,
            subjectName: subj.subject.subjectName
          } : null
        }))
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  async checkExistingAssignments(classId, subjects, term, currentAssignmentId = null) {
    try {
      const query = { classId: classId };
      if (currentAssignmentId) {
        query._id = { $ne: currentAssignmentId };
      }

      const existingAssignments = await this.models.AssignSubjects.find(query)
        .populate('subjects.subject', 'subjectCode subjectName');

      if (!existingAssignments.length) {
        return { hasDuplicates: false, duplicateSubjects: [] };
      }

      // Check for duplicates only in the same term
      const assignedSubjectIds = existingAssignments.reduce((acc, assignment) => {
        const sameTermSubjects = assignment.subjects
          .filter(s => s.term === Number(term))
          .map(s => s.subject.toString());
        return [...acc, ...sameTermSubjects];
      }, []);

      const duplicateSubjects = subjects.filter(subjectId => 
        assignedSubjectIds.includes(subjectId.toString())
      );

      const subjectDetails = await this.models.Subject.find({
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
  }

  async updateOrCreateAssignment(classId, data, userId) {
    try {
      const existingAssignment = await this.models.AssignSubjects.findOne({
        classId: classId
      });

      const subjectsWithTerm = data.subjects.map(subjectId => ({
        subject: subjectId,
        term: Number(data.term)
      }));

      const historyEntry = {
        updatedBy: userId,
        updatedAt: new Date(),
        action: existingAssignment ? 'updated' : 'created'
      };

      if (existingAssignment) {
        const existingSubjects = existingAssignment.subjects.filter(
          s => s.term !== Number(data.term)
        );

        await existingAssignment.updateOne({
          yearLevel: data.yearLevel,
          subjects: [...existingSubjects, ...subjectsWithTerm],
          $push: { updateHistory: historyEntry }
        });

        return existingAssignment;
      } else {
        return await this.models.AssignSubjects.create({
          yearLevel: data.yearLevel,
          classId: classId,
          subjects: subjectsWithTerm,
          updateHistory: [historyEntry]
        });
      }
    } catch (error) {
      console.error('Error updating/creating assignment:', error);
      throw new Error('Failed to update/create assignment');
    }
  }

  async getGroupedAssignments() {
    try {
      const assignments = await this.fetchAssignments();
      
      // Group assignments by classId
      return assignments.reduce((acc, curr) => {
        if (!curr.classId) return acc;
        
        const key = curr.classId._id;
        if (!acc[key]) {
          acc[key] = {
            ...curr,
            subjects: curr.subjects // Keep the original subjects array structure
          };
        }
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting grouped assignments:', error);
      throw error;
    }
  }

  async deleteAssignmentById(id, userId) {
    try {
      await this.initializeModels();
      
      const historyEntry = {
        updatedBy: userId,
        updatedAt: new Date(),
        action: 'deleted'
      };

      // Add final history entry before deletion
      await this.models.AssignSubjects.findByIdAndUpdate(
        id,
        { $push: { updateHistory: historyEntry } }
      );

      await this.models.AssignSubjects.findByIdAndDelete(id);
      return true;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  }

  async updateAssignmentById(id, data, userId) {
    try {
      await this.initializeModels();
      
      const currentAssignment = await this.models.AssignSubjects.findById(id);
      if (!currentAssignment) {
        throw new Error('Assignment not found');
      }

      const validation = await this.checkExistingAssignments(
        data.classes[0],
        data.subjects,
        data.term,
        id
      );

      if (validation.hasDuplicates) {
        throw new Error(`Some subjects are already assigned: ${validation.duplicateSubjects.join(', ')}`);
      }

      const existingSubjects = currentAssignment.subjects.filter(
        s => s.term !== Number(data.term)
      );

      const newSubjects = data.subjects.map(subjectId => ({
        subject: subjectId,
        term: Number(data.term)
      }));

      const historyEntry = {
        updatedBy: userId,
        updatedAt: new Date(),
        action: 'updated'
      };

      await this.models.AssignSubjects.findByIdAndUpdate(
        id,
        {
          yearLevel: data.yearLevel.replace(' Year', ''),
          classId: data.classes[0],
          subjects: [...existingSubjects, ...newSubjects],
          $push: { updateHistory: historyEntry }
        },
        { new: true }
      );

      return true;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }

  async fetchDepartments() {
    try {
      await this.initializeModels();
      
      const departments = await this.models.Department.find({ isActive: true })
        .select('departmentCode departmentName')
        .lean();

      return departments.map(dept => ({
        _id: dept._id.toString(),
        departmentCode: dept.departmentCode,
        departmentName: dept.departmentName
      }));
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const assignSubjectsModel = new AssignSubjectsModel();
export default assignSubjectsModel;