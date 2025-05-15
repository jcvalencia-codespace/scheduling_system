import mongoose from 'mongoose';
import { SectionSchema, SubjectSchema, AssignSubjectsSchema, CourseSchema, DepartmentSchema, UserSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';

class AssignSubjectsModel {
  constructor() {
    this.models = {
      Subject: null,
      Section: null,
      Course: null,
      Department: null,
      AssignSubjects: null,
      User: null
    };
  }

  async initializeModels() {
    try {
      await connectDB();

      // Initialize all models in proper order (dependencies first)
      this.models.Department = mongoose.models.Departments || 
        mongoose.model('Departments', DepartmentSchema);

      this.models.Course = mongoose.models.Courses || 
        mongoose.model('Courses', CourseSchema);

      this.models.Subject = mongoose.models.Subjects || 
        mongoose.model('Subjects', SubjectSchema);

      this.models.Section = mongoose.models.Sections || 
        mongoose.model('Sections', SectionSchema);

      this.models.AssignSubjects = mongoose.models.AssignSubjects || 
        mongoose.model('AssignSubjects', AssignSubjectsSchema);

      this.models.User = mongoose.models.Users || 
        mongoose.model('Users', UserSchema);

      return true;
    } catch (error) {
      console.error('Error initializing models:', error);
      throw error;
    }
  }

  async fetchClasses(yearLevel, userId) {
    try {
      await this.initializeModels();
      const formattedYearLevel = yearLevel.replace(' Year', '');
      
      const user = await this.models.User.findById(userId)
        .populate({
          path: 'department',
          model: this.models.Department
        })
        .populate({
          path: 'course',
          model: this.models.Course
        });
      
      if (!user) {
        throw new Error('User not found');
      }

      let query = { 
        yearLevel: formattedYearLevel + ' Year',
        isActive: true 
      };

      // If user is dean, only fetch sections from their department
      if (user?.role === 'Dean' && user?.department) {
        query.department = user.department._id;
      }
      // If user is program chair, only fetch sections from their course
      else if (user?.role === 'Program Chair' && user?.course) {
        query.course = user.course._id;
      }

      const classes = await this.models.Section.find(query)
        .populate({
          path: 'course',
          select: 'courseCode courseTitle department',
          model: this.models.Course,
          populate: {
            path: 'department',
            select: 'departmentCode departmentName',
            model: this.models.Department
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
        query.department = departmentId; // Use the department ID directly
      }

      const subjects = await this.models.Subject.find(query)
        .populate({
          path: 'department',
          select: 'departmentCode departmentName'
        })
        .select('subjectCode subjectName lectureHours labHours department')
        .lean();

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

  async fetchCoursesByDepartment(departmentId) {
    try {
      await this.initializeModels();
      
      const courses = await this.models.Course.find({ 
        department: departmentId,
        isActive: true 
      })
      .populate({
        path: 'department',
        select: 'departmentCode departmentName'
      })
      .select('courseCode courseTitle department')
      .lean();

      return courses.map(course => ({
        ...course,
        _id: course._id.toString(),
        department: course.department ? {
          ...course.department,
          _id: course.department._id.toString()
        } : null
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async fetchAssignments(userId = null) {
    try {
      await this.initializeModels();
      
      // Get active term first
      const activeTerm = await mongoose.model('Terms').findOne({
        status: 'Active',
        isVisible: true
      }).lean();

      if (!activeTerm) {
        throw new Error('No active term found');
      }

      let user = null;
      if (userId) {
        user = await this.models.User.findById(userId)
          .populate({
            path: 'course',
            model: this.models.Course,
            select: '_id courseCode courseTitle'
          })
          .populate({
            path: 'department',
            model: this.models.Department
          })
          .lean();
      }

      let query = {
        academicYear: activeTerm.academicYear // Filter by active academic year only
      };
      
      // Build the role-based query
      if (user?.role?.toLowerCase() === 'program chair' && user?.course?._id) {
        query['classId.course'] = user.course._id;
      } else if (user?.role?.toLowerCase() === 'dean' && user?.department?._id) {
        query['classId.course.department'] = user.department._id;
      }

      const assignments = await this.models.AssignSubjects.find(query)
        .populate({
          path: 'classId',
          model: this.models.Section,
          select: '_id sectionName yearLevel course',
          populate: {
            path: 'course',
            model: this.models.Course,
            select: 'courseCode courseTitle department',
            populate: {
              path: 'department',
              model: this.models.Department,
              select: 'departmentCode departmentName'
            }
          }
        })
        .populate({
          path: 'subjects.subject',
          model: this.models.Subject,
          select: 'subjectCode subjectName'
        })
        .lean();

      // Transform the assignments data
      return assignments.map(assignment => ({
        _id: assignment._id.toString(),
        yearLevel: assignment.yearLevel,
        academicYear: assignment.academicYear,
        classId: assignment.classId ? {
          _id: assignment.classId._id.toString(),
          sectionName: assignment.classId.sectionName,
          yearLevel: assignment.classId.yearLevel,
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
          hours: subj.hours,
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

      const subjectsWithTerm = data.subjects.map(subject => ({
        subject: subject.subjectId,
        term: Number(data.term),
        termId: data.termId,
        hours: Number(subject.hours)
      }));

      const historyEntry = {
        updatedBy: userId,
        updatedAt: new Date(),
        action: existingAssignment ? 'updated' : 'created',
        academicYear: data.academicYear
      };

      if (existingAssignment) {
        const existingSubjects = existingAssignment.subjects.filter(
          s => s.term !== Number(data.term)
        );

        await existingAssignment.updateOne({
          yearLevel: data.yearLevel,
          academicYear: data.academicYear,
          subjects: [...existingSubjects, ...subjectsWithTerm],
          $push: { updateHistory: historyEntry }
        });

        return existingAssignment;
      } else {
        return await this.models.AssignSubjects.create({
          yearLevel: data.yearLevel,
          classId: classId,
          academicYear: data.academicYear,
          subjects: subjectsWithTerm,
          updateHistory: [historyEntry]
        });
      }
    } catch (error) {
      console.error('Error updating/creating assignment:', error);
      throw new Error('Failed to update/create assignment');
    }
  }

  async getGroupedAssignments(userId = null) {
    try {
      const assignments = await this.fetchAssignments(userId); // Pass userId to fetchAssignments
      
      // Group assignments by classId
      return assignments.reduce((acc, curr) => {
        if (!curr.classId) return acc;
        
        const key = curr.classId._id;
        if (!acc[key]) {
          acc[key] = {
            ...curr,
            subjects: curr.subjects
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
        data.subjects.map(s => s.subjectId),
        data.term,
        id
      );

      if (validation.hasDuplicates) {
        throw new Error(`Some subjects are already assigned: ${validation.duplicateSubjects.join(', ')}`);
      }

      const existingSubjects = currentAssignment.subjects.filter(
        s => s.term !== Number(data.term)
      );

      const newSubjects = data.subjects.map(subject => ({
        subject: subject.subjectId,
        term: Number(data.term),
        hours: Number(subject.hours) // Add hours field
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

  async getActiveTerm() {
    try {
      await this.initializeModels();

      const activeTerm = await mongoose.model('Terms').findOne({
        status: 'Active',
        isVisible: true
      }).sort({ createdAt: -1 }).lean();

      if (!activeTerm) {
        throw new Error('No active term found');
      }

      return {
        _id: activeTerm._id.toString(),
        academicYear: activeTerm.academicYear,
        term: activeTerm.term
      };
    } catch (error) {
      console.error('Error getting active term:', error);
      throw error;
    }
  }

  async fetchYearLevelsByCourse(courseId) {
    try {
      await this.initializeModels();
      
      const yearLevels = await this.models.Section.find({ 
        course: courseId,
        isActive: true 
      })
      .distinct('yearLevel')
      .lean();

      return yearLevels.sort();
    } catch (error) {
      console.error('Error fetching year levels:', error);
      throw error;
    }
  }

  async fetchSectionsByCourseAndYear(courseId, yearLevel) {
    try {
      await this.initializeModels();
      
      const sections = await this.models.Section.find({ 
        course: courseId,
        yearLevel: yearLevel,
        isActive: true 
      })
      .select('sectionName')
      .lean();

      return sections.map(section => section.sectionName).sort();
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }
  }

  async fetchAllCourses() {
    try {
      await this.initializeModels();
      
      const courses = await this.models.Course.find({ 
        isActive: true 
      })
      .populate({
        path: 'department',
        select: 'departmentCode departmentName'
      })
      .select('courseCode courseTitle department')
      .lean();

      return courses.map(course => ({
        ...course,
        _id: course._id.toString(),
        department: course.department ? {
          ...course.department,
          _id: course.department._id.toString()
        } : null
      }));
    } catch (error) {
      console.error('Error fetching all courses:', error);
      throw error;
    }
  }

  async fetchAllYearLevels() {
    try {
      await this.initializeModels();
      
      const yearLevels = await this.models.Section.find({ 
        isActive: true 
      })
      .distinct('yearLevel')
      .lean();

      return yearLevels.sort();
    } catch (error) {
      console.error('Error fetching all year levels:', error);
      throw error;
    }
  }

  async fetchAllSections() {
    try {
      await this.initializeModels();
      
      const sections = await this.models.Section.find({ 
        isActive: true 
      })
      .select('sectionName')
      .lean();

      return sections.map(section => section.sectionName).sort();
    } catch (error) {
      console.error('Error fetching all sections:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const assignSubjectsModel = new AssignSubjectsModel();
export default assignSubjectsModel;