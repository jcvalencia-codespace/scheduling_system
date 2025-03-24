'use server';

import subjectsModel from '../../../../models/Subjects';
import { revalidatePath } from 'next/cache';

export async function addSubject(formData) {
  try {
    const subjectData = {
      schoolYear: formData.get('schoolYear'),
      term: parseInt(formData.get('term')),
      subjectCode: formData.get('subjectCode')?.trim().toUpperCase(),
      subjectName: formData.get('subjectName')?.trim(),
      lectureHours: parseFloat(formData.get('lectureHours')),
      labHours: parseFloat(formData.get('labHours')),
      course: formData.get('course')?.trim(),
      unit: formData.get('unit')?.trim()
    };

    console.log('Server received subject data:', subjectData);

    // Validate required fields
    const requiredFields = ['schoolYear', 'term', 'subjectCode', 'subjectName', 'lectureHours', 'labHours', 'course'];
    for (const field of requiredFields) {
      if (!subjectData[field] && subjectData[field] !== 0) {
        throw new Error(`${field} is required`);
      }
    }

    // Check if subject code already exists
    const existingSubject = await subjectsModel.getSubjectByCode(subjectData.subjectCode);
    if (existingSubject) {
      console.log('Subject code already exists:', subjectData.subjectCode);
      throw new Error('Subject code already exists');
    }

    const savedSubject = await subjectsModel.createSubject(subjectData);
    console.log('Subject created successfully:', savedSubject);
    
    revalidatePath('/entry/subjects');
    return { success: true, subject: savedSubject };
  } catch (error) {
    console.error('Error in addSubject:', error);
    return { error: error.message || 'Failed to create subject' };
  }
}

export async function getSubjects() {
  try {
    console.log('Server received request to fetch all subjects');
    const subjects = await subjectsModel.getAllSubjects();
    console.log('Fetched subjects successfully:', subjects.length);
    return { subjects };
  } catch (error) {
    console.error('Error in getSubjects:', error);
    return { error: error.message || 'Failed to fetch subjects' };
  }
}

export async function getSubjectsByTerm(schoolYear, term) {
  try {
    console.log('Server received request to fetch subjects for:', { schoolYear, term });
    const subjects = await subjectsModel.getSubjectsByTerm(schoolYear, term);
    console.log('Fetched subjects successfully:', subjects.length);
    return { subjects };
  } catch (error) {
    console.error('Error in getSubjectsByTerm:', error);
    return { error: error.message || 'Failed to fetch subjects' };
  }
}

export async function editSubject(subjectCode, formData) {
  try {
    console.log('Server received request to edit subject:', subjectCode);
    const updateData = {
      schoolYear: formData.get('schoolYear'),
      term: parseInt(formData.get('term')),
      subjectName: formData.get('subjectName')?.trim(),
      lectureHours: parseFloat(formData.get('lectureHours')),
      labHours: parseFloat(formData.get('labHours')),
      course: formData.get('course')?.trim()
    };

    // Remove undefined or null values
    Object.keys(updateData).forEach(key => 
      (updateData[key] === undefined || updateData[key] === null) && delete updateData[key]
    );

    console.log('Server received subject data to update:', updateData);

    const updatedSubject = await subjectsModel.updateSubject(subjectCode, updateData);
    if (!updatedSubject) {
      throw new Error('Subject not found');
    }
    
    console.log('Subject updated successfully:', updatedSubject);
    
    revalidatePath('/entry/subjects');
    return { success: true, subject: updatedSubject };
  } catch (error) {
    console.error('Error in editSubject:', error);
    return { error: error.message || 'Failed to update subject' };
  }
}

export async function removeSubject(subjectCode) {
  try {
    console.log('Server received request to delete subject:', subjectCode);
    const deletedSubject = await subjectsModel.deleteSubject(subjectCode);
    if (!deletedSubject) {
      throw new Error('Subject not found');
    }
    
    console.log('Subject deleted successfully:', deletedSubject);
    
    revalidatePath('/entry/subjects');
    return { success: true, subject: deletedSubject };
  } catch (error) {
    console.error('Error in removeSubject:', error);
    return { error: error.message || 'Failed to delete subject' };
  }
}
