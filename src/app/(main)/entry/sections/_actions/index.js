'use server';

import sectionsModel from '@/app/models/Sections';
import coursesModel from '@/app/models/Courses';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

export async function getSections() {
  try {
    const sections = await sectionsModel.getAllSectionsWithDepartment();
    if (!sections) {
      throw new Error('No sections found');
    }
    return { sections };
  } catch (error) {
    console.error('Error fetching sections:', error);
    return { error: error.message || 'Failed to fetch sections' };
  }
}

export async function addSection(formData) {
  try {
    const sectionName = formData.get('sectionName');
    const courseId = formData.get('courseCode');
    const yearLevel = formData.get('yearLevel');
    const userId = formData.get('userId'); // Get the user ID from form data

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    // Check if a section with the same name already exists
    const existingSection = await sectionsModel.getSectionByName(sectionName);
    
    // If section exists and is active, reject the creation
    if (existingSection && existingSection.isActive) {
      return { error: 'A section with this name already exists' };
    }

    // Get course with department by ID
    const course = await coursesModel.getCourseById(courseId);
    if (!course) {
      return { error: 'Course not found' };
    }

    // If section exists but is inactive, reactivate it instead of creating a new one
    if (existingSection && !existingSection.isActive) {
      const updateData = {
        course: courseId,
        department: course.department,
        yearLevel,
        isActive: true,
        updatedBy: new mongoose.Types.ObjectId(userId)
      };

      const reactivatedSection = await sectionsModel.updateSection(sectionName, updateData);
      if (!reactivatedSection) {
        throw new Error('Failed to reactivate section');
      }

      revalidatePath('/entry/sections');
      return { success: true, section: reactivatedSection, reactivated: true };
    }

    // Otherwise, create a new section
    const sectionData = {
      sectionName,
      course: courseId,
      department: course.department,
      yearLevel,
      isActive: true,
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId)
    };

    const newSection = await sectionsModel.createSection(sectionData);
    if (!newSection) {
      throw new Error('Failed to save section');
    }

    revalidatePath('/entry/sections');
    return { success: true, section: newSection };
  } catch (error) {
    console.error('Error adding section:', error);
    return { error: error.message || 'Failed to add section' };
  }
}

export async function editSection(sectionName, formData) {
  try {
    const courseId = formData.get('courseCode');
    const newYearLevel = formData.get('yearLevel');
    const userId = formData.get('userId');
    const newSectionName = formData.get('sectionName'); // Get the new section name

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    // Get course with department by ID
    const course = await coursesModel.getCourseById(courseId);
    if (!course) {
      return { error: 'Course not found' };
    }

    // Ensure department is available in the course
    if (!course.department || !course.department._id) {
      return { error: 'Department information is missing from the course' };
    }

    const updateData = {
      sectionName: newSectionName, // Add the new section name to update data
      course: new mongoose.Types.ObjectId(courseId),
      department: new mongoose.Types.ObjectId(course.department._id),
      yearLevel: newYearLevel,
      updatedBy: new mongoose.Types.ObjectId(userId)
    };

    const updatedSection = await sectionsModel.updateSection(sectionName, updateData);
    if (!updatedSection) {
      return { error: 'Section not found' };
    }

    revalidatePath('/entry/sections');
    return { success: true, section: updatedSection };
  } catch (error) {
    console.error('Error editing section:', error);
    return { error: error.message || 'Failed to edit section' };
  }
}

export async function removeSection(sectionName, userId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    const updateData = {
      updatedBy: new mongoose.Types.ObjectId(userId)
    };

    const deletedSection = await sectionsModel.deleteSection(sectionName, updateData);
    
    if (!deletedSection) {
      return { error: 'Section not found or already inactive' };
    }

    revalidatePath('/entry/sections', 'page');
    return { success: true, section: deletedSection };
  } catch (error) {
    console.error('Error removing section:', error);
    return { error: error.message || 'Failed to remove section' };
  }
}

export async function getCourses() {
  try {
    const courses = await coursesModel.getAllCoursesWithDepartment();
    if (!courses) {
      throw new Error('No courses found');
    }
    return { courses };
  } catch (error) {
    console.error('Error in getCourses:', error);
    return { error: error.message || 'Failed to fetch courses' };
  }
}

