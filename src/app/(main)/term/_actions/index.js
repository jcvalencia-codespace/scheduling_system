'use server';

import termsModel from '@/app/models/Terms';
import { revalidatePath } from 'next/cache';

export async function getTerms() {
  try {
    const terms = await termsModel.getAllTerms();
    return { terms };
  } catch (error) {
    console.error('Error in getTerms:', error);
    return { error: error.message || 'Failed to fetch terms' };
  }
}

export async function addTerm(formData) {
  try {
    const termData = {
      academicYear: formData.get('academicYear')?.trim(),
      term: formData.get('term')?.trim(),
      startDate: formData.get('startDate')?.trim(),
      endDate: formData.get('endDate')?.trim(),
    };

    // Validate required fields
    const requiredFields = ['academicYear', 'term', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (!termData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    const savedTerm = await termsModel.createTerm(termData);
    revalidatePath('/term');
    return { success: true, term: savedTerm };
  } catch (error) {
    console.error('Error in addTerm:', error);
    return { error: error.message || 'Failed to create term' };
  }
}

export async function editTerm(id, formData) {
  try {
    const termData = {
      academicYear: formData.get('academicYear')?.trim(),
      term: formData.get('term')?.trim(),
      startDate: formData.get('startDate')?.trim(),
      endDate: formData.get('endDate')?.trim(),
    };

    // Validate required fields
    const requiredFields = ['academicYear', 'term', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (!termData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    const updatedTerm = await termsModel.updateTerm(id, termData);
    revalidatePath('/term');
    return { success: true, term: updatedTerm };
  } catch (error) {
    console.error('Error in editTerm:', error);
    return { error: error.message || 'Failed to update term' };
  }
}

export async function activateTerm(id) {
  try {
    const activatedTerm = await termsModel.activateTerm(id);
    revalidatePath('/term');
    return { success: true, term: activatedTerm };
  } catch (error) {
    console.error('Error in activateTerm:', error);
    return { error: error.message || 'Failed to activate term' };
  }
}

export async function deactivateTerm(id) {
  try {
    const deactivatedTerm = await termsModel.deactivateTerm(id);
    revalidatePath('/term');
    return { success: true, term: deactivatedTerm };
  } catch (error) {
    console.error('Error in deactivateTerm:', error);
    return { error: error.message || 'Failed to deactivate term' };
  }
}

export async function removeTerm(id) {
  try {
    // Check if term is active
    const term = await termsModel.getTermById(id);
    if (term?.status === 'Active') {
      throw new Error('Cannot delete an active term');
    }

    const success = await termsModel.deleteTerm(id);
    if (!success) {
      throw new Error('Term not found');
    }
    revalidatePath('/term');
    return { success: true };
  } catch (error) {
    console.error('Error in removeTerm:', error);
    return { error: error.message || 'Failed to delete term' };
  }
}

export async function endAllTerms() {
  try {
    const success = await termsModel.endAllTerms();
    if (!success) {
      throw new Error('No active terms found');
    }
    revalidatePath('/term');
    return { success: true };
  } catch (error) {
    console.error('Error in endAllTerms:', error);
    return { error: error.message || 'Failed to deactivate terms' };
  }
}

export async function toggleTermVisibility(academicYear) {
  try {
    const success = await termsModel.toggleTermVisibility(academicYear);
    if (!success) {
      throw new Error('Failed to toggle term visibility');
    }
    revalidatePath('/term');
    return { success: true };
  } catch (error) {
    console.error('Error in toggleTermVisibility:', error);
    return { error: error.message || 'Failed to toggle term visibility' };
  }
}

export async function getAllAcademicYears() {
  try {
    const years = await termsModel.getAllAcademicYears();
    return { years };
  } catch (error) {
    console.error('Error in getAllAcademicYears:', error);
    return { error: error.message || 'Failed to fetch academic years' };
  }
}
