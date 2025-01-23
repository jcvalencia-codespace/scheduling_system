'use server';

import termsModel from '@/app/models/Terms';

export async function getActiveTerm() {
  try {
    const term = await termsModel.getActiveTerm();
    if (!term) {
      return { error: 'No active term found' };
    }
    return { term };
  } catch (error) {
    console.error('Error getting active term:', error);
    return { error: error.message || 'Failed to get active term' };
  }
}
