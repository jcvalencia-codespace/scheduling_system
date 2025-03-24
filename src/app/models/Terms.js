import mongoose from 'mongoose';
import { TermSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';

class TermsModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Term || mongoose.model("Term", TermSchema);
    }
    return this.MODEL;
  }

  async getAllTerms() {
    try {
      const Term = await this.initModel();
      const terms = await Term.find({})
        .sort({ academicYear: -1, startDate: 1 })
        .lean();
      return terms.map(this.mapTermData);
    } catch (error) {
      console.error('Error in getAllTerms:', error);
      throw error;
    }
  }

  async getTermById(id) {
    try {
      const Term = await this.initModel();
      const term = await Term.findById(id).lean();
      return term ? this.mapTermData(term) : null;
    } catch (error) {
      console.error('Error in getTermById:', error);
      throw error;
    }
  }

  async getActiveTerm() {
    try {
      const Term = await this.initModel();
      const term = await Term.findOne({ status: 'Active' }).lean();
      console.log('Active term found:', term); // Debug log
      return term ? this.mapTermData(term) : null;
    } catch (error) {
      console.error('Error in getActiveTerm:', error);
      throw error;
    }
  }

  async createTerm(termData) {
    try {
      const Term = await this.initModel();
      const newTerm = new Term({
        academicYear: termData.academicYear,
        term: termData.term,
        startDate: termData.startDate,
        endDate: termData.endDate,
        status: 'Inactive'
      });
      
      const savedTerm = await newTerm.save();
      return this.mapTermData(savedTerm);
    } catch (error) {
      console.error('Error in createTerm:', error);
      if (error.code === 11000) {
        throw new Error('A term with this academic year and term number already exists');
      }
      throw error;
    }
  }

  async updateTerm(id, termData) {
    try {
      const Term = await this.initModel();
      const updatedTerm = await Term.findByIdAndUpdate(
        id,
        {
          academicYear: termData.academicYear,
          term: termData.term,
          startDate: termData.startDate,
          endDate: termData.endDate
        },
        { new: true, runValidators: true }
      ).lean();

      if (!updatedTerm) {
        throw new Error('Term not found');
      }

      return this.mapTermData(updatedTerm);
    } catch (error) {
      console.error('Error in updateTerm:', error);
      if (error.code === 11000) {
        throw new Error('A term with this academic year and term number already exists');
      }
      throw error;
    }
  }

  async activateTerm(id) {
    try {
      const Term = await this.initModel();
      
      // Start a session for the transaction
      const session = await Term.startSession();
      let activatedTerm;

      await session.withTransaction(async () => {
        // First, deactivate all terms
        await Term.updateMany(
          { status: 'Active' },
          { status: 'Inactive' },
          { session }
        );

        // Then activate the specified term
        activatedTerm = await Term.findByIdAndUpdate(
          id,
          { status: 'Active' },
          { new: true, session, runValidators: true }
        ).lean();

        if (!activatedTerm) {
          throw new Error('Term not found');
        }
      });

      await session.endSession();
      return this.mapTermData(activatedTerm);
    } catch (error) {
      console.error('Error in activateTerm:', error);
      throw error;
    }
  }

  async deactivateTerm(id) {
    try {
      const Term = await this.initModel();
      
      // Check if term exists and is active
      const term = await Term.findById(id);
      if (!term) {
        throw new Error('Term not found');
      }
      
      if (term.status !== 'Active') {
        throw new Error('Term is already inactive');
      }

      // Deactivate the term
      const deactivatedTerm = await Term.findByIdAndUpdate(
        id,
        { status: 'Inactive' },
        { new: true, runValidators: true }
      ).lean();

      return this.mapTermData(deactivatedTerm);
    } catch (error) {
      console.error('Error in deactivateTerm:', error);
      throw error;
    }
  }

  async deleteTerm(id) {
    try {
      const Term = await this.initModel();
      
      // Check if term is active
      const term = await Term.findById(id);
      if (!term) {
        throw new Error('Term not found');
      }
      
      if (term.status === 'Active') {
        throw new Error('Cannot delete an active term');
      }

      await Term.findByIdAndDelete(id);
      return true;
    } catch (error) {
      console.error('Error in deleteTerm:', error);
      throw error;
    }
  }

  mapTermData(term) {
    return {
      id: term._id.toString(),
      academicYear: term.academicYear,
      term: term.term,
      startDate: term.startDate.toISOString().split('T')[0],
      endDate: term.endDate.toISOString().split('T')[0],
      status: term.status,
    };
  }
}

// Create and export a singleton instance
const termsModel = new TermsModel();
export default termsModel;
