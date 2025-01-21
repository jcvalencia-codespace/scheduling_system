'use server';

import sectionsModel from '@/app/models/Sections';
import coursesModel from '@/app/models/Courses';
import { revalidatePath } from 'next/cache';

export async function getSections() {
  try {
    const sections = await sectionsModel.getAllSections();
    return { sections };
  } catch (error) {
    console.error('Error fetching sections:', error);
    return { error: 'Failed to fetch sections' };
  }
}

export async function addSection(formData) {
  try {
    const sectionName = formData.get('sectionName');
    const courseCode = formData.get('courseCode');
    const yearLevel = formData.get('yearLevel');

    // Check if section already exists
    const existingSection = await sectionsModel.getSectionByName(sectionName);
    if (existingSection) {
      return { error: 'Section already exists' };
    }

    // Get department from course
    const course = await coursesModel.getCourseByCode(courseCode);
    if (!course) {
      return { error: 'Course not found' };
    }

    const sectionData = {
      sectionName,
      courseCode,
      departmentCode: course.departmentCode,
      yearLevel,
    };

    const newSection = await sectionsModel.createSection(sectionData);
    revalidatePath('/entry/sections');
    return { success: true, section: newSection };
  } catch (error) {
    console.error('Error adding section:', error);
    return { error: error.message || 'Failed to add section' };
  }
}

export async function editSection(sectionName, formData) {
  try {
    const newCourseCode = formData.get('courseCode');
    const newYearLevel = formData.get('yearLevel');

    // Get department from course
    const course = await coursesModel.getCourseByCode(newCourseCode);
    if (!course) {
      return { error: 'Course not found' };
    }

    const updateData = {
      courseCode: newCourseCode,
      departmentCode: course.departmentCode,
      yearLevel: newYearLevel,
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

export async function removeSection(sectionName) {
  try {
    const deletedSection = await sectionsModel.deleteSection(sectionName);
    if (!deletedSection) {
      return { error: 'Section not found' };
    }

    revalidatePath('/entry/sections');
    return { success: true, section: deletedSection };
  } catch (error) {
    console.error('Error removing section:', error);
    return { error: error.message || 'Failed to remove section' };
  }
}

export async function getCourses() {
  try {
    const courses = await coursesModel.getAllCourses();
    return { courses };
  } catch (error) {
    console.error('Error in getCourses:', error);
    return { error: error.message || 'Failed to fetch courses' };
  }
}

