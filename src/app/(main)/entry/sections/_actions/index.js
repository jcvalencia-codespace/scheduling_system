'use server';

import sectionsModel from '@/app/models/Sections';
import coursesModel from '@/app/models/Courses';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

export async function getSections() {
  try {
    await sectionsModel.initModel(); // Ensure models are initialized
    const sections = await sectionsModel.getAllSectionsWithDepartment();
    if (!sections) {
      throw new Error('No sections found');
    }
    return { sections: JSON.parse(JSON.stringify(sections)) };
  } catch (error) {
    console.error('Error fetching sections:', error);
    return { error: error.message || 'Failed to fetch sections' };
  }
}

export async function addSection(formData) {
  try {
    const userId = formData.get('userId');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    const result = await sectionsModel.processSectionCreation(formData);
    revalidatePath('/entry/sections');
    return { success: true, ...result };
  } catch (error) {
    console.error('Error adding section:', error);
    return { error: error.message || 'Failed to add section' };
  }
}

export async function editSection(sectionId, formData) {
  try {
    const userId = formData.get('userId');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    const result = await sectionsModel.processSectionUpdate(sectionId, formData);
    revalidatePath('/entry/sections');
    return { success: true, ...result };
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

    const result = await sectionsModel.processSectionDeletion(sectionName, userId);
    revalidatePath('/entry/sections');
    return { success: true, ...result };
  } catch (error) {
    console.error('Error removing section:', error);
    return { error: error.message || 'Failed to remove section' };
  }
}

export async function getCourses(userId) {
  try {
    await sectionsModel.initModel();
    const courses = await coursesModel.getCoursesByUserRole(userId);
    if (!courses) {
      throw new Error('No courses found');
    }
    return { courses: JSON.parse(JSON.stringify(courses)) };
  } catch (error) {
    console.error('Error in getCourses:', error);
    return { error: error.message || 'Failed to fetch courses' };
  }
}

