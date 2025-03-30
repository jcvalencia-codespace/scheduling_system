import { SectionSchema, DepartmentSchema, CourseSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class SectionsModel {
  constructor() {
    this.MODEL = null;
    this.DEPARTMENT_MODEL = null;
    this.COURSE_MODEL = null;
  }

  async initModel() {
    if (!this.MODEL || !this.DEPARTMENT_MODEL || !this.COURSE_MODEL) {
      await connectDB();
      // Initialize Department model first
      this.DEPARTMENT_MODEL = mongoose.models.Departments || mongoose.model("Departments", DepartmentSchema);
      // Then Course model
      this.COURSE_MODEL = mongoose.models.Courses || mongoose.model("Courses", CourseSchema);
      // Finally Section model
      this.MODEL = mongoose.models.Sections || mongoose.model("Sections", SectionSchema);
    }
    return this.MODEL;
  }

  async createSection(sectionData) {
    try {
      const Section = await this.initModel();
      
      // Start a session for transaction
      const session = await mongoose.startSession();
      let result;
      
      try {
        await session.withTransaction(async () => {
          // First deactivate any existing active section with the same name
          await Section.findOneAndUpdate(
            { sectionName: sectionData.sectionName, isActive: true },
            { isActive: false },
            { session }
          );
          
          // Create new section
          const section = new Section(sectionData);
          await section.save({ session });
          
          // Populate the section after saving
          result = await Section.findById(section._id)
            .populate({
              path: 'course',
              select: 'courseCode courseTitle department',
              populate: {
                path: 'department',
                select: 'departmentCode departmentName'
              }
            })
            .populate({
              path: 'department',
              select: 'departmentCode departmentName'
            })
            .session(session);
        });
        
        await session.endSession();
        return JSON.parse(JSON.stringify(result));
      } catch (error) {
        await session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error in createSection:', error);
      throw error;
    }
  }

  async getAllSections() {
    const Sections = await this.initModel();
    const sections = await Sections.find({ isActive: true })
      .sort({ sectionName: 1 });
    return JSON.parse(JSON.stringify(sections));
  }

  async getAllSectionsWithDepartment() {
    try {
      const Section = await this.initModel();
      const sections = await Section.find({ isActive: true })
        .populate({
          path: 'course', // Changed from courseCode
          select: 'courseCode courseTitle department',
          populate: {
            path: 'department',
            select: 'departmentCode departmentName'
          }
        })
        .populate({
          path: 'department',
          select: 'departmentCode departmentName'
        });
      return JSON.parse(JSON.stringify(sections));
    } catch (error) {
      console.error('Error in getAllSectionsWithDepartment:', error);
      throw error;
    }
  }

  async getSectionByNameAndStatus(sectionName, isActive) {
    const Section = await this.initModel();
    const section = await Section.findOne({ sectionName, isActive });
    return section ? JSON.parse(JSON.stringify(section)) : null;
  }

  async getSectionByName(sectionName) {
    // Update existing method to get any section regardless of status
    const Section = await this.initModel();
    const section = await Section.findOne({ sectionName });
    return section ? JSON.parse(JSON.stringify(section)) : null;
  }

  async updateSection(sectionName, updateData) {
    const Section = await this.initModel();
    // Add update history entry
    const updatedSection = await Section.findOneAndUpdate(
      { sectionName },
      { 
        $set: updateData,
        $push: { 
          updateHistory: {
            updatedBy: updateData.updatedBy,
            updatedAt: new Date(),
            action: 'updated'
          }
        }
      },
      { new: true, runValidators: true }
    ).populate({
      path: 'course',
      select: 'courseCode courseTitle department',
      populate: {
        path: 'department',
        select: 'departmentCode departmentName'
      }
    }).populate({
      path: 'department',
      select: 'departmentCode departmentName'
    });
    return updatedSection ? JSON.parse(JSON.stringify(updatedSection)) : null;
  }

  async deleteSection(sectionName, updateData) {
    const Section = await this.initModel();
    
    // First get the section to ensure it exists
    const existingSection = await Section.findOne({ sectionName, isActive: true });
    if (!existingSection) return null;

    // Then update it with the deactivation and history
    const section = await Section.findOneAndUpdate(
      { _id: existingSection._id },
      { 
        $set: { isActive: false },
        $push: { 
          updateHistory: {
            updatedBy: updateData.updatedBy,
            updatedAt: new Date(),
            action: 'deleted'
          }
        }
      },
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

  async checkDuplicateSectionName(sectionName) {
    const Section = await this.initModel();
    const existingSection = await Section.findOne({ sectionName });
    return existingSection ? JSON.parse(JSON.stringify(existingSection)) : null;
  }

  async processSectionCreation(formData) {
    const sectionName = formData.get('sectionName');
    const courseId = formData.get('courseCode');
    const yearLevel = formData.get('yearLevel');
    const userId = formData.get('userId');

    // Check for existing section
    const existingSection = await this.getSectionByName(sectionName);
    
    // If section exists and is active, reject creation
    if (existingSection && existingSection.isActive) {
      throw new Error('A section with this name already exists');
    }

    // Get course with department
    const course = await this.COURSE_MODEL.findById(courseId).populate('department');
    if (!course) {
      throw new Error('Course not found');
    }

    // Handle reactivation of inactive section
    if (existingSection && !existingSection.isActive) {
      const updateData = {
        course: courseId,
        department: course.department,
        yearLevel,
        isActive: true,
        updatedBy: new mongoose.Types.ObjectId(userId),
        $push: {
          updateHistory: {
            updatedBy: new mongoose.Types.ObjectId(userId),
            updatedAt: new Date(),
            action: 'reactivated'
          }
        }
      };

      const reactivatedSection = await this.updateSection(sectionName, updateData);
      if (!reactivatedSection) {
        throw new Error('Failed to reactivate section');
      }
      return { section: reactivatedSection, reactivated: true };
    }

    // Create new section
    const sectionData = {
      sectionName,
      course: courseId,
      department: course.department,
      yearLevel,
      isActive: true,
      updateHistory: [{
        updatedBy: new mongoose.Types.ObjectId(userId),
        updatedAt: new Date(),
        action: 'created'
      }]
    };

    const newSection = await this.createSection(sectionData);
    if (!newSection) {
      throw new Error('Failed to save section');
    }

    return { section: newSection };
  }

  async processSectionUpdate(sectionName, formData) {
    const courseId = formData.get('courseCode');
    const newYearLevel = formData.get('yearLevel');
    const userId = formData.get('userId');
    const newSectionName = formData.get('sectionName');

    // Get course with department
    const course = await this.COURSE_MODEL.findById(courseId).populate('department');
    if (!course) {
      throw new Error('Course not found');
    }

    if (!course.department || !course.department._id) {
      throw new Error('Department information is missing from the course');
    }

    const updateData = {
      sectionName: newSectionName,
      course: new mongoose.Types.ObjectId(courseId),
      department: new mongoose.Types.ObjectId(course.department._id),
      yearLevel: newYearLevel,
      updatedBy: new mongoose.Types.ObjectId(userId),
      $push: {
        updateHistory: {
          updatedBy: new mongoose.Types.ObjectId(userId),
          updatedAt: new Date(),
          action: 'updated'
        }
      }
    };

    const updatedSection = await this.updateSection(sectionName, updateData);
    if (!updatedSection) {
      throw new Error('Section not found');
    }

    return { section: updatedSection };
  }

  async processSectionDeletion(sectionName, userId) {
    const updateData = {
      updatedBy: new mongoose.Types.ObjectId(userId),
      $push: {
        updateHistory: {
          updatedBy: new mongoose.Types.ObjectId(userId),
          updatedAt: new Date(),
          action: 'deleted'
        }
      }
    };

    const deletedSection = await this.deleteSection(sectionName, updateData);
    if (!deletedSection) {
      throw new Error('Section not found or already inactive');
    }

    return { section: deletedSection };
  }

  async getAllCoursesWithDepartment() {
    await this.initModel();
    const courses = await this.COURSE_MODEL.find({ isActive: true })
      .populate('department', 'departmentCode departmentName');
    return JSON.parse(JSON.stringify(courses));
  }
}

const sectionsModel = new SectionsModel();
export default sectionsModel;