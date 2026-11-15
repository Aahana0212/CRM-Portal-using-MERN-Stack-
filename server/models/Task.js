const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Task title is required'], trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ['call', 'email', 'meeting', 'follow-up', 'other'], default: 'follow-up' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'completed' ? new Date() : undefined;
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
