import mongoose from 'mongoose';
import { AccessSettingsSchema } from '../../../db/schema';

let AccessSettings;
try {
  // Try to get the existing model
  AccessSettings = mongoose.model('AccessSettings');
} catch {
  // If not exists, create new model
  AccessSettings = mongoose.model('AccessSettings', AccessSettingsSchema);
}

export default AccessSettings;
