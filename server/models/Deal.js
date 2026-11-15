const mongoose = require('mongoose');

const STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Deal title is required'], trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: [true, 'Customer is required'] },
    value: { type: Number, default: 0, min: [0, 'Value cannot be negative'] },
    stage: { type: String, enum: STAGES, default: 'prospecting' },
    probability: { type: Number, min: 0, max: 100, default: 10 },
    expectedCloseDate: { type: Date },
    closedAt: { type: Date },
    description: { type: String, trim: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-set probability & closedAt based on stage
const STAGE_PROB = { prospecting: 10, qualification: 25, proposal: 50, negotiation: 75, won: 100, lost: 0 };
dealSchema.pre('save', function (next) {
  if (this.isModified('stage')) {
    this.probability = STAGE_PROB[this.stage];
    this.closedAt = ['won', 'lost'].includes(this.stage) ? new Date() : undefined;
  }
  next();
});

dealSchema.statics.STAGES = STAGES;
dealSchema.statics.STAGE_PROB = STAGE_PROB;

module.exports = mongoose.model('Deal', dealSchema);
