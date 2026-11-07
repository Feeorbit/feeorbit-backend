const mongoose = require('mongoose');
const Gym = require('../models/Gym');
const Plan = require('../models/Plan');
const Member = require('../models/Member');
const Payment = require('../models/Payment');

// @desc    Get all gyms / branches (with optional ownership scoping)
// @route   GET /api/gyms
exports.getGyms = async (req, res) => {
  try {
    const { owner, parentGym, userGymId } = req.query;
    let query = { isActive: true };

    const isValidOwner = owner && owner !== 'undefined' && owner !== 'null' && mongoose.Types.ObjectId.isValid(owner);
    const isValidUserGym = userGymId && userGymId !== 'undefined' && userGymId !== 'null' && mongoose.Types.ObjectId.isValid(userGymId);
    const isValidParent = parentGym && parentGym !== 'undefined' && parentGym !== 'null' && mongoose.Types.ObjectId.isValid(parentGym);

    if (isValidOwner && isValidUserGym) {
      query = {
        $or: [
          { _id: userGymId },
          { parentGym: userGymId },
          { owner: owner },
        ],
        isActive: true,
      };
    } else if (isValidOwner) {
      query.owner = owner;
    } else if (isValidParent) {
      query.parentGym = parentGym;
    } else if (isValidUserGym) {
      query = {
        $or: [{ _id: userGymId }, { parentGym: userGymId }],
        isActive: true,
      };
    }

    let gyms = await Gym.find(query).sort({ createdAt: 1 });

    // Fallback: If scoped query returned 0 gyms, find active gyms so workspace is never left without a gym
    if ((!gyms || gyms.length === 0) && (isValidOwner || isValidUserGym)) {
      gyms = await Gym.find({ isActive: true }).sort({ createdAt: 1 });
    }

    res.json({ success: true, count: gyms.length, data: gyms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Haversine formula for exact distance in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place (e.g. 1.4 km)
}

// @desc    Explore all public gyms with nearby distance & Google Maps
// @route   GET /api/gyms/explore
exports.explorePublicGyms = async (req, res) => {
  try {
    const { lat, lng, city, search } = req.query;
    let query = { isActive: { $ne: false } };

    if (city && city !== 'all') {
      query.city = new RegExp(city, 'i');
    }

    const rawGyms = await Gym.find(query).sort({ rating: -1, createdAt: -1 });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasUserLocation = !isNaN(userLat) && !isNaN(userLng);

    let gyms = rawGyms.map((g) => {
      const gymObj = g.toObject ? g.toObject() : g;

      // Ensure fallback location if empty
      const gymLat = gymObj.location?.lat || 28.6139;
      const gymLng = gymObj.location?.lng || 77.209;

      let distanceKm = null;
      if (hasUserLocation) {
        distanceKm = calculateDistanceKm(userLat, userLng, gymLat, gymLng);
      }

      // Google Maps Navigation & Directions URL
      const encodedDest = encodeURIComponent(`${gymObj.name}, ${gymObj.address}`);
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}`;
      const embedMapUrl = `https://maps.google.com/maps?q=${gymLat},${gymLng}&z=15&output=embed`;

      return {
        _id: gymObj._id,
        name: gymObj.name,
        slug: gymObj.slug,
        tagline: gymObj.tagline || 'Where Champions Train',
        address: gymObj.address,
        city: gymObj.city || 'Delhi NCR',
        area: gymObj.area || 'City Center',
        phone: gymObj.phone,
        email: gymObj.email,
        openingHours: gymObj.openingHours,
        facilityType: gymObj.facilityType || 'Fitness Club',
        location: { lat: gymLat, lng: gymLng },
        startingPrice: gymObj.startingPrice || 1499,
        rating: gymObj.rating || 4.9,
        totalReviews: gymObj.totalReviews || 120,
        coverImageUrl:
          gymObj.coverImageUrl ||
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
        amenitiesList: gymObj.amenitiesList?.length
          ? gymObj.amenitiesList
          : ['Air Conditioned', 'Clean Showers', 'Free Parking', 'Cardio Arena', 'Lockers'],
        distanceKm,
        directionsUrl,
        embedMapUrl,
      };
    });

    // Filter by search keyword
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      gyms = gyms.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.address.toLowerCase().includes(q) ||
          g.area.toLowerCase().includes(q) ||
          g.city.toLowerCase().includes(q)
      );
    }

    // If user provided location, sort by closest distance first!
    if (hasUserLocation) {
      gyms.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    res.json({
      success: true,
      count: gyms.length,
      hasUserLocation,
      userLocation: hasUserLocation ? { lat: userLat, lng: userLng } : null,
      data: gyms,
    });
  } catch (error) {
    console.error('explorePublicGyms Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get all branches for a parent gym
// @route   GET /api/gyms/:id/branches
exports.getBranches = async (req, res) => {
  try {
    const rawBranches = await Gym.find({
      $or: [{ _id: req.params.id }, { parentGym: req.params.id }],
      isActive: true,
    }).sort({ createdAt: 1 });

    const branches = await Promise.all(
      rawBranches.map(async (b) => {
        const item = b.toObject();
        item.memberCount = await Member.countDocuments({ gym: b._id });
        item.activeMembers = await Member.countDocuments({ gym: b._id, status: 'active' });
        const pAgg = await Payment.aggregate([
          { $match: { gym: b._id, status: 'paid' } },
          { $group: { _id: null, sum: { $sum: '$amount' } } },
        ]);
        item.totalRevenue = pAgg[0]?.sum || 0;
        return item;
      })
    );

    res.json({ success: true, count: branches.length, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new Branch under an existing Gym (Gym Admin)
// @route   POST /api/gyms/branch
exports.createBranch = async (req, res) => {
  try {
    const { parentGymId, branchName, branchCode, phone, address, ownerId } = req.body;

    if (!parentGymId || !branchName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Parent gym, branch name, and contact phone are required',
      });
    }

    const parent = await Gym.findById(parentGymId);
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Parent gym not found' });
    }

    const fullBranchName = `${parent.name} - ${branchName}`;
    const slug =
      fullBranchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') +
      '-' +
      Date.now().toString().slice(-4);

    const branch = await Gym.create({
      name: fullBranchName,
      slug,
      phone,
      address: address || parent.address,
      owner: ownerId || parent.owner,
      isBranch: true,
      parentGym: parent._id,
      branchName: branchName,
      branchCode: branchCode || `BR-${Date.now().toString().slice(-3)}`,
      currency: parent.currency,
      primaryColor: parent.primaryColor,
    });

    // Seed default plans for the new branch
    const defaultPlans = [
      { name: 'Monthly Standard', durationMonths: 1, price: 1500, gym: branch._id },
      { name: 'Quarterly Fitness', durationMonths: 3, price: 4000, gym: branch._id },
      { name: 'Annual VIP', durationMonths: 12, price: 12000, gym: branch._id },
    ];
    await Plan.insertMany(defaultPlans);

    res.status(201).json({
      success: true,
      data: branch,
      message: `Branch "${branch.name}" created successfully with default plans!`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single gym details with full CMS settings
// @route   GET /api/gyms/:id
exports.getGymById = async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.id);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }
    res.json({ success: true, data: gym });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new Gym / Branch
// @route   POST /api/gyms
exports.createGym = async (req, res) => {
  try {
    const { name, phone, address, ...rest } = req.body;
    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Gym name, phone number, and address are required',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const gym = await Gym.create({
      name,
      slug,
      phone,
      address,
      ...rest,
    });

    res.status(201).json({ success: true, data: gym, message: 'Gym branch created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update Gym CMS & Branding Settings
// @route   PUT /api/gyms/:id/settings
exports.updateGymSettings = async (req, res) => {
  try {
    const gym = await Gym.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    res.json({
      success: true,
      data: gym,
      message: 'Gym CMS settings and branding updated successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
