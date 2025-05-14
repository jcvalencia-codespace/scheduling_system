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
      
      // Drop the unique index if it exists
      try {
        await this.MODEL.collection.dropIndex('sectionName_1');
      } catch (error) {
        // Ignore error if index doesn't exist
        if (error.code !== 27) {
          console.error('Error dropping index:', error);
        }
      }
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
      
      // Check all active sections with the same name without considering course or year
      const activeSection = await Section.findOne({ 
        sectionName: sectionData.sectionName,
        isActive: true
      });
      
      if (activeSection) {
        throw new Error('A section with this name already exists. Please choose a different section name.');
      }

      // Create new section document regardless of existing inactive ones
      const section = new Section({
        ...sectionData,
        isActive: true,
        updateHistory: [{
          updatedBy: sectionData.userId,
          updatedAt: new Date(),
          action: 'created',
          academicYear: sectionData.academicYear
        }]
      });
      
      await section.save();
      
      // Populate and return the new section
      const result = await Section.findById(section._id)
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
        });

      return JSON.parse(JSON.stringify(result));
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

  async getAllSectionsWithDepartment(userRole = null, departmentId = null, courseId = null) {
    try {
      const Section = await this.initModel();
      
      console.log('Getting sections with params:', { userRole, departmentId, courseId }); // Debug log

      let query = { isActive: true };

      // Add role-based filters
      if (userRole === 'Dean' && departmentId) {
        query.department = departmentId;
      } else if (userRole === 'Program Chair' && courseId) {
        query.course = courseId;
      }

      const sections = await Section.find(query)
        .populate({
          path: 'course',
          select: 'courseCode courseTitle department',
          populate: {
            path: 'department',
            select: 'departmentCode departmentName'
          }
        })
        .populate('department', 'departmentCode departmentName')
        .lean();

      // Add display name
      const sectionsWithDisplayName = sections.map(section => ({
        ...section,
        displayName: `${section.sectionName} - ${section.course?.courseCode || 'No Course'}`
      }));

      console.log(`Found ${sectionsWithDisplayName.length} sections`); // Debug log

      return sectionsWithDisplayName;
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

  async deleteSection(sectionName, updateData) {
    const Section = await this.initModel();
    const { $push, ...otherUpdateData } = updateData;

    const section = await Section.findOneAndUpdate(
      { sectionName: sectionName, isActive: true },
      { 
        $set: { ...otherUpdateData, isActive: false },
        $push: updateData.$push
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

    // Instead of deactivating existing sections, check if an active section exists
    const Section = await this.initModel();
    const existingSection = await Section.findOne({
      sectionName: sectionName,
      isActive: true
    });

    if (existingSection) {
      throw new Error('A section with this name already exists and is active. Please choose a different section name.');
    }

    // Get course with department
    const course = await this.COURSE_MODEL.findById(courseId).populate('department');
    if (!course) {
      throw new Error('Course not found');
    }

    // Create new section with academicYear
    const sectionData = {
      sectionName,
      course: courseId,
      department: course.department,
      yearLevel,
      isActive: true,
      userId,
      academicYear: activeTerm.academicYear
    };

    const newSection = await this.createSection(sectionData);
    if (!newSection) {
      throw new Error('Failed to save section');
    }

    return { section: newSection };
  }

  async processSectionUpdate(sectionId, formData) {
    const userId = formData.get('userId');
    const newSectionName = formData.get('sectionName');
    
    // First check if the new section name already exists (excluding current section)
    const Section = await this.initModel();
    const existingSection = await Section.findOne({
      _id: { $ne: sectionId },
      sectionName: newSectionName,
      isActive: true
    });

    if (existingSection) {
      throw new Error('A section with this name already exists. Please choose a different section name.');
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
      sectionName: newSectionName,
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

    const updatedSection = await this.updateSection(sectionId, updateData);
    if (!updatedSection) {
      throw new Error('Failed to update section');
    }
    return { section: updatedSection };
  }

  async processSectionDeletion(sectionName, userId) {
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