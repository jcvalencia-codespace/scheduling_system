import { SubjectSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class SubjectsModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Subjects || mongoose.model("Subjects", SubjectSchema);
    }
    return this.MODEL;
  }

  async createSubject(subjectData) {
    const Subject = await this.initModel();
    const subject = new Subject(subjectData);
    const savedSubject = await subject.save();
    return JSON.parse(JSON.stringify(savedSubject));
  }

  async getAllSubjects() {
    const Subject = await this.initModel();
    const subjects = await Subject.find({ isActive: true });
    return JSON.parse(JSON.stringify(subjects));
  }

  async getSubjectByCode(subjectCode) {
    const Subject = await this.initModel();
    const subject = await Subject.findOne({ subjectCode, isActive: true });
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async getSubjectsByTerm(schoolYear, term) {
    const Subject = await this.initModel();
    const subjects = await Subject.find({ schoolYear, term, isActive: true });
    return JSON.parse(JSON.stringify(subjects));
  }

  async updateSubject(subjectCode, updateData) {
    const Subject = await this.initModel();
    const subject = await Subject.findOneAndUpdate(
      { subjectCode, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }

  async deleteSubject(subjectCode) {
    const Subject = await this.initModel();
    // Soft delete by setting isActive to false
    const subject = await Subject.findOneAndUpdate(
      { subjectCode, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    return subject ? JSON.parse(JSON.stringify(subject)) : null;
  }
}

// Create and export a singleton instance
const subjectsModel = new SubjectsModel();
export default subjectsModel;
