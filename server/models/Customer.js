const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Customer name is required'], trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^$|^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    // Lead lifecycle: a "lead" becomes a "customer" once converted
    type: { type: String, enum: ['lead', 'customer'], default: 'lead' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'lost', 'active', 'inactive'],
      default: 'new',
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'social', 'email', 'call', 'event', 'other'],
      default: 'website',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: [noteSchema],
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', email: 'text', company: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
