'use server';

import subjectsModel from '../../../../models/Subjects';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

export async function addSubject(formData) {
  try {
    const userId = formData.get('userId');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    const subjectData = {
      subjectCode: formData.get('subjectCode')?.trim().toUpperCase(),
      subjectName: formData.get('subjectName')?.trim(),
      lectureHours: parseFloat(formData.get('lectureHours')),
      labHours: parseFloat(formData.get('labHours')),
      course: formData.get('course'),
      userId: new mongoose.Types.ObjectId(userId)
    };

    const savedSubject = await subjectsModel.processSubjectCreation(subjectData);
    revalidatePath('/entry/subjects');
    return { success: true, subject: savedSubject };
  } catch (error) {
    console.error('Error in addSubject:', error);
    return { error: error.message || 'Failed to create subject' };
  }
}

export async function editSubject(subjectCode, formData) {
  try {
    const userId = formData.get('userId');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    const updateData = {
      subjectCode: formData.get('subjectCode')?.trim().toUpperCase(),
      subjectName: formData.get('subjectName')?.trim(),
      lectureHours: parseFloat(formData.get('lectureHours')),
      labHours: parseFloat(formData.get('labHours')),
      course: formData.get('course'),
      updatedBy: new mongoose.Types.ObjectId(userId),
      $push: {
        updateHistory: {
          updatedBy: new mongoose.Types.ObjectId(userId),
          updatedAt: new Date(),
          action: 'updated'
        }
      }
    };

    const updatedSubject = await subjectsModel.processSubjectUpdate(subjectCode, updateData);
    revalidatePath('/entry/subjects');
    return { success: true, subject: updatedSubject };
  } catch (error) {
    console.error('Error in editSubject:', error);
    return { error: error.message || 'Failed to update subject' };
  }
}

export async function removeSubject(subjectCode, userId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    const deletedSubject = await subjectsModel.processSubjectDeletion(
      subjectCode, 
      new mongoose.Types.ObjectId(userId)
    );
    
    revalidatePath('/entry/subjects');
    return { success: true, subject: deletedSubject };
  } catch (error) {
    console.error('Error in removeSubject:', error);
    return { error: error.message || 'Failed to delete subject' };
  }
}

export async function getSubjects() {
  try {
    const subjects = await subjectsModel.getAllSubjects();
    return { success: true, subjects };
  } catch (error) {
    console.error('Error in getSubjects:', error);
    return { error: error.message || 'Failed to fetch subjects' };
  }
}

export async function getCourses() {
  try {
    const courses = await subjectsModel.getAllCourses();
    return { courses };
  } catch (error) {
    console.error('Error in getCourses:', error);
    return { error: error.message || 'Failed to fetch courses' };
  }
}
