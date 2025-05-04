import { SectionSchema, DepartmentSchema, CourseSchema, TermSchema } from '../../../db/schema';
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

  async validateSectionData(sectionData) {
    // Get active term
    const Term = mongoose.models.Term || mongoose.model('Term', TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }
    sectionData.academicYear = activeTerm.academicYear;

    // Continue with existing validation
  }

  async createSection(sectionData) {
    try {
      const Section = await this.initModel();
      const section = new Section({
        ...sectionData,
        updateHistory: [{
          updatedBy: sectionData.userId,
          updatedAt: new Date(),
          action: 'created',
          academicYear: sectionData.academicYear
        }]
      });
      
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
        })
        .populate('updateHistory.updatedBy', 'firstName lastName'); // Add this line
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
    const Section = await this.initModel();
    const section = await Section.findOne({ sectionName })
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
      .populate('updateHistory.updatedBy', 'firstName lastName'); // Add this line
    return section ? JSON.parse(JSON.stringify(section)) : null;
  }

  async updateSection(id, updateData) {
    const Section = await this.initModel();
    const { $push, ...otherUpdateData } = updateData;

    // Convert string ID to ObjectId if needed
    const _id = typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) 
      ? new mongoose.Types.ObjectId(id) 
      : id;

    const updatedSection = await Section.findOneAndUpdate(
      { _id, isActive: true },
      { 
        $set: otherUpdateData,
        $push: updateData.$push // updateData.$push already contains academicYear
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

  async deleteSection(id, updateData) {
    const Section = await this.initModel();
    const { $push, ...otherUpdateData } = updateData;

    const section = await Section.findOneAndUpdate(
      { _id: id, isActive: true },
      { 
        $set: { ...otherUpdateData, isActive: false },
        $push: updateData.$push // updateData.$push already contains academicYear
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

  async reactivateSection(id, userId) {
    // Get active term
    const Term = mongoose.models.Term || mongoose.model('Term', TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }

    const Section = await this.initModel();
    const section = await Section.findOneAndUpdate(
      { _id: id, isActive: false },
      { 
        isActive: true,
        $push: {
          updateHistory: {
            updatedBy: userId,
            updatedAt: new Date(),
            action: 'reactivated',
            academicYear: activeTerm.academicYear
          }
        }
      },
      { new: true }
    ).populate('department', 'departmentCode departmentName');
    
    return section ? JSON.parse(JSON.stringify(section)) : null;
  }

  async processSectionCreation(formData) {
    // Get active term first
    const Term = mongoose.models.Term || mongoose.model('Term', TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }

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
            action: 'reactivated',
            academicYear: activeTerm.academicYear // Add academicYear here
          }
        }
      };

      const reactivatedSection = await this.updateSection(existingSection._id, updateData);
      if (!reactivatedSection) {
        throw new Error('Failed to reactivate section');
      }
      return { section: reactivatedSection, reactivated: true };
    }

    // Create new section with academicYear
    const sectionData = {
      sectionName,
      course: courseId,
      department: course.department,
      yearLevel,
      isActive: true,
      userId,
      academicYear: activeTerm.academicYear // Add academicYear here
    };

    const newSection = await this.createSection(sectionData);
    if (!newSection) {
      throw new Error('Failed to save section');
    }

    return { section: newSection };
  }

  async processSectionUpdate(sectionId, formData) {
    const userId = formData.get('userId');
    const section = await this.getSectionByName(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Get active term
    const Term = mongoose.models.Term || mongoose.model('Term', TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }

    // Get course with department
    const course = await this.COURSE_MODEL.findById(formData.get('courseCode')).populate('department');
    if (!course) {
      throw new Error('Course not found');
    }

    const updateData = {
      sectionName: formData.get('sectionName'),
      course: formData.get('courseCode'),
      department: course.department._id,
      yearLevel: formData.get('yearLevel'),
      updatedBy: new mongoose.Types.ObjectId(userId),
      $push: {
        updateHistory: {
          updatedBy: new mongoose.Types.ObjectId(userId),
          updatedAt: new Date(),
          action: 'updated',
          academicYear: activeTerm.academicYear
        }
      }
    };

    const updatedSection = await this.updateSection(section._id, updateData);
    return { section: updatedSection };
  }

  async processSectionDeletion(sectionId, userId) {
    // Get active term
    const Term = mongoose.models.Term || mongoose.model('Term', TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }

    const updateData = {
      updatedBy: new mongoose.Types.ObjectId(userId),
      $push: {
        updateHistory: {
          updatedBy: new mongoose.Types.ObjectId(userId),
          updatedAt: new Date(),
          action: 'deleted',
          academicYear: activeTerm.academicYear
        }
      }
    };

    const deletedSection = await this.deleteSection(sectionId, updateData);
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

  async getYearLevelsByDepartment(departmentId) {
    try {
      const Section = await this.initModel();
      const query = departmentId ? { department: departmentId, isActive: true } : { isActive: true };
      
      const yearLevels = await Section.distinct('yearLevel', query);
      return yearLevels.sort();
    } catch (error) {
      console.error('Error in getYearLevelsByDepartment:', error);
      throw error;
    }
  }

  async getSectionsByDepartment(departmentId) {
    try {
      const Section = await this.initModel();
      const query = departmentId ? { department: departmentId, isActive: true } : { isActive: true };
      
      const sections = await Section.find(query)
        .select('sectionName')
        .lean();

      return sections.map(section => section.sectionName).sort();
    } catch (error) {
      console.error('Error in getSectionsByDepartment:', error);
      throw error;
    }
  }
}

const sectionsModel = new SectionsModel();
export default sectionsModel;