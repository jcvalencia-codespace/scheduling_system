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
      const terms = await Term.find({ isVisible: true })  // Only get visible terms
        .sort({ academicYear: -1, startDate: 1 })
        .lean();
      return terms.map(this.mapTermData);
    } catch (error) {
      console.error('Error in getAllTerms:', error);
      throw error;
    }
  }

  async getAllAcademicYears() {
    try {
      const Term = await this.initModel();
      const years = await Term.distinct('academicYear');
      return years.sort((a, b) => b.localeCompare(a)); // Sort in descending order
    } catch (error) {
      console.error('Error in getAllAcademicYears:', error);
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
        status: 'Inactive',
        isVisible: true  // New terms are visible by default
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

  async getTermsByNumbers(termNumbers = []) {
    try {
      const Term = await this.initModel();
      const terms = await Term.find({
        term: { $in: termNumbers.map(num => `Term ${num}`) }
      })
        .sort({ academicYear: -1 })
        .lean();
      return terms.map(this.mapTermData);
    } catch (error) {
      console.error('Error in getTermsByNumbers:', error);
      throw error;
    }
  }

  async endAllTerms() {
    try {
      const Term = await this.initModel();
      const result = await Term.updateMany(
        { isVisible: true }, // Only update visible terms
        { 
          status: 'Inactive',
          isVisible: false  // Hide the terms
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error in endAllTerms:', error);
      throw error;
    }
  }

  async getAllArchivedTerms() {
    try {
      const Term = await this.initModel()
      const terms = await Term.find({
        $and: [
          { status: { $ne: "Active" } },  // Exclude active terms
          {
            $or: [
              { status: "Inactive" },
              { isVisible: true }
            ]
          }
        ]
      })
        .sort({ academicYear: -1, term: 1 })
        .lean()

      // Debug log the raw terms
      console.log('Raw archived and visible terms:', terms.map(t => ({
        id: t._id,
        term: t.term,
        academicYear: t.academicYear,
        status: t.status,
        isVisible: t.isVisible
      })))

      const groupedTerms = terms.reduce((acc, term) => {
        if (!acc[term.academicYear]) {
          acc[term.academicYear] = []
        }
        acc[term.academicYear].push({
          _id: term._id,
          term: term.term,
          academicYear: term.academicYear,
          startDate: term.startDate,
          endDate: term.endDate,
          status: term.status,
          isVisible: term.isVisible
        })
        return acc
      }, {})

      console.log('Grouped terms:', Object.keys(groupedTerms).length, 'academic years')
      return JSON.parse(JSON.stringify(groupedTerms))
    } catch (error) {
      console.error('Error in getAllArchivedTerms:', error)
      throw error
    }
  }

  async toggleTermVisibility(academicYear) {
    try {
      const Term = await this.initModel();
      const session = await Term.startSession();
      
      await session.withTransaction(async () => {
        // First, set all currently visible terms to invisible
        await Term.updateMany(
          { isVisible: true },
          { isVisible: false },
          { session }
        );

        // Then set all terms of the selected academic year to visible
        await Term.updateMany(
          { academicYear: academicYear },
          { isVisible: true },
          { session }
        );
      });

      await session.endSession();
      return true;
    } catch (error) {
      console.error('Error in toggleTermVisibility:', error);
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
      isVisible: term.isVisible,
    };
  }
}

// Create and export a singleton instance
const termsModel = new TermsModel();
export default termsModel;