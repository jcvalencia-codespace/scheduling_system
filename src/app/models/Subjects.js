import { SubjectSchema, CourseSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class SubjectsModel {
  constructor() {
    this.MODEL = null;
    this.CourseModel = null;
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

  async createSubject(subjectData) {
    const Subject = await this.initModel();
    const subject = new Subject(subjectData);
    const savedSubject = await subject.save();
    return JSON.parse(JSON.stringify(savedSubject));
  }

  async getAllSubjects() {

    const Subject = await this.initModel();
    const subjects = await Subject.find({ isActive: true })
      .populate({
        path: 'course',
        select: 'courseCode courseTitle department',
        populate: {
          path: 'department',
          select: 'departmentCode departmentName'
        }
      });

    return JSON.parse(JSON.stringify(subjects));
  }

  async getSubjectByCode(subjectCode) {
    const Subject = await this.initModel();
    const subject = await Subject.findOne({ subjectCode, isActive: true }).populate('course', 'courseCode courseTitle');
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async getActiveSubjectByCode(subjectCode) {
    const Subject = await this.initModel();
    const subject = await Subject.findOne({ 
      subjectCode, 
      isActive: true 
    }).populate('course', 'courseCode courseTitle');
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async updateSubject(subjectCode, updateData) {
    const Subject = await this.initModel();
    const subject = await Subject.findOneAndUpdate(
      { subjectCode, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('course', 'courseCode courseTitle');
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async deleteSubject(subjectCode) {
    const Subject = await this.initModel();
    try {
      const subject = await Subject.findOneAndUpdate(
        { subjectCode: subjectCode, isActive: true },
        { $set: { isActive: false } },
        { new: true }
      ).populate('course', 'courseCode courseTitle');

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
    const courses = await Course.find({ isActive: true });
    return JSON.parse(JSON.stringify(courses));
  }
}

// Create and export a singleton instance
const subjectsModel = new SubjectsModel();
export default subjectsModel;
