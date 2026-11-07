const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Rent',
        'Utilities',
        'Staff Salaries',
        'Equipment Maintenance',
        'Cleaning & Sanitation',
        'Marketing',
        'Supplements & Goods',
        'Other',
      ],
      default: 'Utilities',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card'],
      default: 'Bank Transfer',
    },
    paidTo: {
      type: String,
      default: '',
    },
    referenceNumber: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
