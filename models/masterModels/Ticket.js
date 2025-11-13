const mongoose = require('mongoose');

// Helper Schema to manage the ticket ID sequence
const SequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Sequence = mongoose.model('Sequence', SequenceSchema);

const TicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required.'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required.'],
    },
    category: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Pre-save hook to generate the auto-incrementing ticketId
TicketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const sequence = await Sequence.findByIdAndUpdate(
      { _id: 'ticketId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.ticketId = `TKT-${String(sequence.seq).padStart(3, '0')}`;
  }
  next();
});

const Ticket = mongoose.model('Ticket', TicketSchema);
module.exports = Ticket;