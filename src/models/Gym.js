const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Gym name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Where Champions Train',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
    },
    email: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: 'Main Branch Location, City Center',
    },
    city: {
      type: String,
      default: 'Delhi NCR',
    },
    area: {
      type: String,
      default: 'Central District',
    },
    location: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.2090 },
    },
    startingPrice: {
      type: Number,
      default: 1499,
    },
    rating: {
      type: Number,
      default: 4.9,
    },
    totalReviews: {
      type: Number,
      default: 140,
    },
    coverImageUrl: {
      type: String,
      default: '',
    },
    amenitiesList: {
      type: [String],
      default: ['Air Conditioned', 'Clean Showers', 'Free Parking', 'Cardio Arena', 'Lockers', 'Steam Bath'],
    },
    googleMapsUrl: {
      type: String,
      default: '',
    },
    taxNumber: {
      type: String, // GST / VAT / Tax ID
      default: '',
    },
    taxRate: {
      type: Number,
      default: 18,
    },
    facilityType: {
      type: String,
      default: 'Unisex Fitness Center & Gym',
    },
    openingHours: {
      type: String,
      default: 'Mon - Sat: 06:00 AM - 10:00 PM | Sun: 07:00 AM - 01:00 PM',
    },
    kioskSettings: {
      soundEnabled: { type: Boolean, default: true },
      autoCheckoutHours: { type: Number, default: 2 },
      cooldownMinutes: { type: Number, default: 5 },
      welcomeMessage: { type: String, default: 'Welcome Champ! Have a killer workout!' },
      announcementTicker: { type: String, default: 'Hydrate well • Re-rack your weights after use' },
      allowMultipleCheckIns: { type: Boolean, default: true },
    },
    // Multi-Branch & Tenant Ownership
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isBranch: {
      type: Boolean,
      default: false,
    },
    parentGym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      default: null,
      index: true,
    },
    branchName: {
      type: String,
      default: 'Main Branch',
      trim: true,
    },
    branchCode: {
      type: String,
      default: 'HQ',
      trim: true,
    },
    // Regional & CMS Branding Settings
    currency: {
      code: { type: String, default: 'INR' },
      symbol: { type: String, default: '₹' },
    },
    primaryColor: {
      type: String,
      default: '#6366f1', // Brand theme color: FeeOrbit Royal Indigo
    },
    themePreset: {
      type: String,
      default: 'midnight', // 'midnight' | 'obsidian' | 'cyberpunk' | 'emerald' | 'crimson' | 'sapphire' | 'titanium'
    },
    language: {
      type: String,
      default: 'en', // Fixed to English ('en')
    },
    // Invoicing & Receipt CMS
    invoicePrefix: {
      type: String,
      default: 'REC',
    },
    receiptFooterNote: {
      type: String,
      default: 'Thank you for choosing us! Stay consistent, stay strong.',
    },
    // UPI & Banking Details for Dynamic Invoicing QR
    upiId: {
      type: String,
      default: '',
      trim: true,
    },
    upiPayeeName: {
      type: String,
      default: '',
      trim: true,
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      accountHolder: { type: String, default: '' },
    },
    // Dual Payment Architecture Controls
    paymentSettings: {
      enableDirectUpi: { type: Boolean, default: true },
      enableRazorpay: { type: Boolean, default: true },
      autoApproveDirectUpi: { type: Boolean, default: true },
    },
    // Social Channels & Helpdesk Support
    socialLinks: {
      instagram: { type: String, default: '' },
      website: { type: String, default: '' },
      supportWhatsapp: { type: String, default: '' },
    },
    taxLabel: {
      type: String,
      default: 'GST',
    },
    // Public Portal / Notice Board CMS
    noticeBoard: {
      title: { type: String, default: 'Gym Announcements' },
      content: { type: String, default: 'Welcome to our facility! Please re-rack your weights after use.' },
      isActive: { type: Boolean, default: true },
      priority: { type: String, enum: ['info', 'alert', 'urgent'], default: 'info' },
    },
    // Customizable Message Templates CMS (with {memberName}, {amount}, {planName}, {dueDate})
    templates: {
      welcome: {
        type: String,
        default: 'Welcome to {gymName}, {memberName}! Your {planName} membership is now active. Let’s crush your fitness goals!',
      },
      receipt: {
        type: String,
        default: 'Hi {memberName}, received payment of {currency}{amount} for {planName}. Receipt No: {receiptNo}. Thank you, {gymName}!',
      },
      dueReminder: {
        type: String,
        default: 'Dear {memberName}, a reminder that your fee balance of {currency}{amount} for {planName} is due on {dueDate}. Kindly clear at front desk.',
      },
      expiryAlert: {
        type: String,
        default: 'Hi {memberName}, your gym membership at {gymName} expires in {daysLeft} days on {expiryDate}. Renew today for special perks!',
      },
    },
    // FeeOrbit SaaS Platform Subscription
    subscription: {
      plan: {
        type: String,
        enum: ['starter', 'pro', 'enterprise', 'trial'],
        default: 'trial',
      },
      planName: {
        type: String,
        default: '14-Day Free Trial',
      },
      status: {
        type: String,
        enum: ['active', 'trialing', 'past_due', 'cancelled'],
        default: 'trialing',
      },
      billingCycle: {
        type: String,
        enum: ['monthly', 'annual'],
        default: 'monthly',
      },
      price: {
        type: Number,
        default: 0,
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days free trial
      },
      maxMembers: {
        type: Number,
        default: 500,
      },
      features: [{ type: String }],
      razorpayPaymentId: {
        type: String,
        default: '',
      },
      razorpayOrderId: {
        type: String,
        default: '',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gym', gymSchema);
