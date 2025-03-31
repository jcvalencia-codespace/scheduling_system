import { SubjectSchema, CourseSchema, DepartmentSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class SubjectsModel {
  constructor() {
    this.MODEL = null;
    this.CourseModel = null;
    this.DepartmentModel = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Subjects || mongoose.model("Subjects", SubjectSchema);
    }
    return this.MODEL;
  }

  async initCourseModel() {
    if (!this.CourseModel) {
      await connectDB();
      this.CourseModel = mongoose.models.Courses || mongoose.model('Courses', CourseSchema);
    }
    return this.CourseModel;
  }

  async initDepartmentModel() {
    if (!this.DepartmentModel) {
      await connectDB();
      this.DepartmentModel = mongoose.models.Departments || mongoose.model('Departments', DepartmentSchema);
    }
    return this.DepartmentModel;
  }

  async validateSubjectData(subjectData) {
    const requiredFields = ['subjectCode', 'subjectName', 'lectureHours', 'labHours', 'course', 'department'];
    for (const field of requiredFields) {
      if (!subjectData[field] && subjectData[field] !== 0) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate if course exists
    const Course = await this.initCourseModel();
    const course = await Course.findById(subjectData.course).populate('department');
    if (!course) {
      throw new Error('Invalid course');
    }

    // Validate if department matches course's department
    if (subjectData.department.toString() !== course.department._id.toString()) {
      throw new Error('Department must match course department');
    }
  }

  async getInactiveSubjectByCode(subjectCode) {
    const Subject = await this.initModel();
    const subject = await Subject.findOne({ 
      subjectCode, 
      isActive: false 
    });
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async reactivateSubject(subjectCode, userId) {
    const Subject = await this.initModel();
    const subject = await Subject.findOneAndUpdate(
      { subjectCode, isActive: false },
      { 
        isActive: true,
        updatedBy: userId,
        $push: {
          updateHistory: {
            updatedBy: userId,
            updatedAt: new Date(),
            action: 'updated'
          }
        }
      },
      { new: true }
    ).populate('department', 'departmentCode departmentName');
    
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async processSubjectCreation(subjectData) {
    await this.validateSubjectData(subjectData);
    
    // Check for existing active subject
    const existingActive = await this.getActiveSubjectByCode(subjectData.subjectCode);
    if (existingActive) {
      throw new Error('Subject code already exists');
    }

    // Check for inactive subject
    const existingInactive = await this.getInactiveSubjectByCode(subjectData.subjectCode);
    if (existingInactive) {
      return await this.reactivateSubject(subjectData.subjectCode, subjectData.userId);
    }

    return await this.createSubject(subjectData);
  }

  async processSubjectUpdate(subjectCode, updateData) {
    // Check for duplicate if subject code is being changed
    if (updateData.subjectCode && updateData.subjectCode !== subjectCode) {
      const existingSubject = await this.getActiveSubjectByCodeExcludingCurrent(
        updateData.subjectCode,
        subjectCode
      );
      if (existingSubject) {
        throw new Error('Subject code already exists');
      }
    }

    const updatedSubject = await this.updateSubject(subjectCode, updateData);
    if (!updatedSubject) {
      throw new Error('Subject not found');
    }
    return updatedSubject;
  }

  async processSubjectDeletion(subjectCode, userId) {
    if (!subjectCode) {
      throw new Error('Subject code is required');
    }

    const updateData = {
      updatedBy: userId,
      $push: {
        updateHistory: {
          updatedBy: userId,
          updatedAt: new Date(),
          action: 'deleted'
        }
      }
    };

    const deletedSubject = await this.deleteSubject(subjectCode, updateData);
    if (!deletedSubject) {
      throw new Error('Failed to delete subject');
    }
    return deletedSubject;
  }

  async createSubject(subjectData) {
    const Subject = await this.initModel();
    const subject = new Subject({
      ...subjectData,
      updateHistory: [{
        updatedBy: subjectData.userId,
        updatedAt: new Date(),
        action: 'created'
      }]
    });
    const savedSubject = await subject.save();
    await savedSubject.populate([
      {
        path: 'course',
        select: 'courseCode courseTitle',
        populate: {
          path: 'department',
          select: 'departmentCode departmentName'
        }
      },
      {
        path: 'department',
        select: 'departmentCode departmentName'
      }
    ]);
    return JSON.parse(JSON.stringify(savedSubject));
  }

  async getAllSubjects() {
    const Subject = await this.initModel();
    await this.initCourseModel();
    await this.initDepartmentModel();
    
    const subjects = await Subject.find({ isActive: true })
      .populate({
        path: 'course',
        select: 'courseCode courseTitle',
        populate: {
          path: 'department',
          select: 'departmentCode departmentName'
        }
      })
      .populate('department', 'departmentCode departmentName');

    return JSON.parse(JSON.stringify(subjects));
  }

  async getSubjectByCode(subjectCode) {
    const Subject = await this.initModel();
    const subject = await Subject.findOne({ subjectCode, isActive: true })
      .populate('department', 'departmentCode departmentName');
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async getActiveSubjectByCode(subjectCode) {
    const Subject = await this.initModel();
    const subject = await Subject.findOne({ 
      subjectCode, 
      isActive: true 
    }).populate('department', 'departmentCode departmentName');
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async getActiveSubjectByCodeExcludingCurrent(subjectCode, currentSubjectCode) {
    const Subject = await this.initModel();
    const subject = await Subject.findOne({ 
      subjectCode, 
      isActive: true,
      subjectCode: { $ne: currentSubjectCode } // Exclude current subject
    });
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async updateSubject(subjectCode, updateData) {
    const Subject = await this.initModel();
    const { $push, ...otherUpdateData } = updateData;
    
    const subject = await Subject.findOneAndUpdate(
      { subjectCode, isActive: true },
      { 
        $set: otherUpdateData,
        $push: updateData.$push
      },
      { new: true, runValidators: true }
    ).populate([
      {
        path: 'course',
        select: 'courseCode courseTitle',
        populate: {
          path: 'department',
          select: 'departmentCode departmentName'
        }
      },
      {
        path: 'department',
        select: 'departmentCode departmentName'
      }
    ]);
    
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async deleteSubject(subjectCode, updateData) {
    const Subject = await this.initModel();
    try {
      const { $push, ...otherUpdateData } = updateData;
      
      const subject = await Subject.findOneAndUpdate(
        { subjectCode: subjectCode, isActive: true },
        { 
          $set: { ...otherUpdateData, isActive: false },
          $push: updateData.$push
        },
        { new: true }
      ).populate('department', 'departmentCode departmentName');

      if (!subject) {
        throw new Error('Subject not found or already deleted');
      }

      return JSON.parse(JSON.stringify(subject));
    } catch (error) {
      console.error('Error in deleteSubject:', error);
      throw error;
    }
  }

  async getAllCourses() {
    const Course = await this.initCourseModel();
    const courses = await Course.find({ isActive: true })
      .populate('department', 'departmentCode departmentName');
    return JSON.parse(JSON.stringify(courses));
  }

  async getAllDepartments() {
    const Department = await this.initDepartmentModel();
    const departments = await Department.find({ isActive: true });
    return JSON.parse(JSON.stringify(departments));
  }
}

// Create and export a singleton instance
const subjectsModel = new SubjectsModel();
export default subjectsModel;
