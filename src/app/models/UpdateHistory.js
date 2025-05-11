import mongoose from 'mongoose';

const UpdateHistorySchema = new mongoose.Schema({
  // ...existing schema...
});

// Add a serialization method
UpdateHistorySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj._id = obj._id.toString();
  if (obj.updatedBy && obj.updatedBy._id) {
    obj.updatedBy._id = obj.updatedBy._id.toString();
    if (obj.updatedBy.course && obj.updatedBy.course._id) {
      obj.updatedBy.course._id = obj.updatedBy.course._id.toString();
    }
  }
  return obj;
};

const UpdateHistory = mongoose.models.UpdateHistory || mongoose.model('UpdateHistory', UpdateHistorySchema);
export default UpdateHistory;
