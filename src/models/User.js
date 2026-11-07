const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'staff', 'member'],
      default: 'admin',
    },
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
    },
    assignedBranches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
      },
    ],
    phone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    memberRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    staffRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      select: false,
    },
    emailVerificationExpire: {
      type: Date,
      select: false,
    },
    themePreset: {
      type: String,
      default: 'midnight',
    },
    themeColor: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      gym: this.gym,
      name: this.name,
      email: this.email,
    },
    process.env.JWT_SECRET || 'gym_pulse_super_secret_jwt_key_2026_fitness_erp',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
