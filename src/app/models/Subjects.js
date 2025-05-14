import { SubjectSchema, CourseSchema, DepartmentSchema, UserSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class SubjectsModel {
  constructor() {
    this.MODEL = null;
    this.CourseModel = null;
    this.DepartmentModel = null;
    this.UserModel = null;
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

  async initUserModel() {
    if (!this.UserModel) {
      await connectDB();
      this.UserModel = mongoose.models.Users || mongoose.model('Users', UserSchema);
    }
    return this.UserModel;
  }

  async validateSubjectData(subjectData) {
    const requiredFields = ['subjectCode', 'subjectName', 'department'];
    for (const field of requiredFields) {
      if (!subjectData[field] && subjectData[field] !== 0) {
        throw new Error(`${field} is required`);
      }
    }

    // Get active term
    const Term = mongoose.models.Term || mongoose.model('Term', require('../../../db/schema').TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }
    subjectData.academicYear = activeTerm.academicYear;

    // Validate if department exists
    const Department = await this.initDepartmentModel();
    const department = await Department.findById(subjectData.department);
    if (!department) {
      throw new Error('Invalid department');
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

  async getActiveSubjectByCodeExcludingCurrent(newSubjectCode, currentSubjectCode) {
    const Subject = await this.initModel();
    return await Subject.findOne({ 
      subjectCode: newSubjectCode,
      isActive: true,
      subjectCode: { $ne: currentSubjectCode }
    });
  }

  async processSubjectUpdate(subjectCode, updateData) {
    // Only check for duplicates if subject code is being changed AND it's different from current
    if (updateData.subjectCode && updateData.subjectCode !== subjectCode) {
      console.log('Checking duplicate for:', {
        newCode: updateData.subjectCode,
        currentCode: subjectCode
      });
      
      const existingSubject = await this.MODEL.findOne({
        subjectCode: updateData.subjectCode,
        isActive: true,
        _id: { $ne: updateData._id } // Exclude current subject by _id
      });

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
        action: 'created',
        academicYear: subjectData.academicYear
      }]
    });
    const savedSubject = await subject.save();
    await savedSubject.populate([
      {
        path: 'department',
        select: 'departmentCode departmentName'
      }
    ]);
    return JSON.parse(JSON.stringify(savedSubject));
  }

  async getAllSubjects() {
    const Subject = await this.initModel();
    await this.initDepartmentModel();
    await this.initUserModel();
    
    const subjects = await Subject.find({ isActive: true })
      .populate('department', 'departmentCode departmentName')
      .populate({
        path: 'updateHistory.updatedBy',
        select: 'firstName lastName'
      });

    return JSON.parse(JSON.stringify(subjects));
  }

  async getSubjectByCode(subjectCode) {
    const Subject = await this.initModel();
    await this.initUserModel();
    
    const subject = await Subject.findOne({ subjectCode, isActive: true })
      .populate('department', 'departmentCode departmentName')
      .populate('updateHistory.updatedBy', 'firstName lastName');
    
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

  async updateSubject(subjectCode, updateData) {
    const Subject = await this.initModel();
    
    // Get active term
    const Term = mongoose.models.Term || mongoose.model('Term', require('../../../db/schema').TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }

    const { $push, ...otherUpdateData } = updateData;
    
    // Include academicYear in the update history
    const updatedPush = {
      ...updateData.$push,
      updateHistory: {
        ...updateData.$push.updateHistory,
        academicYear: activeTerm.academicYear
      }
    };

    const subject = await Subject.findOneAndUpdate(
      { subjectCode, isActive: true },
      { 
        $set: otherUpdateData,
        $push: updatedPush
      },
      { new: true, runValidators: true }
    ).populate([
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
      // Get active term
      const Term = mongoose.models.Term || mongoose.model('Term', require('../../../db/schema').TermSchema);
      const activeTerm = await Term.findOne({ status: 'Active' });
      if (!activeTerm) {
        throw new Error('No active term found');
      }

      const { $push, ...otherUpdateData } = updateData;
      
      const subject = await Subject.findOneAndUpdate(
        { subjectCode: subjectCode, isActive: true },
        { 
          $set: { ...otherUpdateData, isActive: false },
          $push: {
            updateHistory: {
              ...updateData.$push.updateHistory,
              academicYear: activeTerm.academicYear
            }
          }
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
