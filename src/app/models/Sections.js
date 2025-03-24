import { SectionSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class SectionsModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Sections || mongoose.model("Sections", SectionSchema);
    }
    return this.MODEL;
  }

  async createSection(sectionData) {
    const Section = await this.initModel();
    const section = new Section(sectionData);
    const savedSection = await section.save();
    return JSON.parse(JSON.stringify(savedSection));
  }

  async getAllSections() {
    const Sections = await this.initModel();
    const sections = await Sections.find({ isActive: true })
      .sort({ sectionName: 1 });
    return JSON.parse(JSON.stringify(sections));
  }

  async getSectionByName(sectionName) {
    const Section = await this.initModel();
    const section = await Section.findOne({ sectionName, isActive: true });
    return section ? JSON.parse(JSON.stringify(section)) : null;
  }

  async updateSection(sectionName, updateData) {
    const Section = await this.initModel();
    const section = await Section.findOneAndUpdate(
      { sectionName, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    return section ? JSON.parse(JSON.stringify(section)) : null;
  }

  async deleteSection(sectionName) {
    const Section = await this.initModel();
    const section = await Section.findOneAndUpdate(
      { sectionName, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    return section ? JSON.parse(JSON.stringify(section)) : null;
  }

  async getSectionsByCourse(courseCode) {
    const Section = await this.initModel();
    const sections = await Section.find({ courseCode, isActive: true });
    return JSON.parse(JSON.stringify(sections));
  }

  async getSectionsByDepartment(departmentCode) {
    const Section = await this.initModel();
    const sections = await Section.find({ departmentCode, isActive: true });
    return JSON.parse(JSON.stringify(sections));
  }
}

const sectionsModel = new SectionsModel();
export default sectionsModel;