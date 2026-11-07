const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const Gym = require('../models/Gym');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_pulse_db';

const extraGyms = [
  {
    name: "Gold's Edge Elite Fitness",
    slug: 'golds-edge-gk1',
    tagline: 'The Benchmark of Premium Body Transformation',
    phone: '9810998877',
    email: 'gk1@goldsedge.fit',
    address: 'M-41, M-Block Main Market, Greater Kailash 1, New Delhi - 110048',
    city: 'Delhi NCR',
    area: 'Greater Kailash 1 (GK-1)',
    location: { lat: 28.5529, lng: 77.2405 },
    startingPrice: 2799,
    rating: 4.9,
    totalReviews: 380,
    coverImageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
    amenitiesList: ['Olympic Platforms', 'Cryotherapy Chamber', 'Sauna & Steam', 'Certified PT Masters', 'Valet Parking', 'Juice & Espresso Bar'],
    facilityType: 'Elite Strength & Functional Lounge',
    openingHours: 'Mon - Sat: 05:30 AM - 11:00 PM | Sun: 07:00 AM - 08:00 PM',
    isActive: true,
  },
  {
    name: 'CultFit Prime & Pilates Arena',
    slug: 'cultfit-prime-gcr',
    tagline: 'Form • Flow • Functional Conditioning',
    phone: '9822334455',
    email: 'gcr@cultprime.fit',
    address: 'Level 2, Central Plaza, Sector 54, Golf Course Road, Gurugram - 122011',
    city: 'Gurugram',
    area: 'Golf Course Road / Sector 54',
    location: { lat: 28.4419, lng: 77.1065 },
    startingPrice: 2199,
    rating: 4.85,
    totalReviews: 512,
    coverImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    amenitiesList: ['Allegro 2 Pilates Reformers', 'Boxing Bags Ring', 'HIIT Turf Floor', 'Cardio Zone', 'Luxury Showers', 'Smoothie Bar'],
    facilityType: 'Reformer Pilates, Boxing & Functional HIIT',
    openingHours: 'Mon - Sun: 06:00 AM - 10:30 PM',
    isActive: true,
  },
  {
    name: 'Kavach Boxing & Combat Sports Hub',
    slug: 'kavach-combat-hkv',
    tagline: 'Fighter Conditioning & Raw Athleticism',
    phone: '9899112233',
    email: 'fight@kavachgym.in',
    address: 'Building 12, Deer Park Entry Road, Hauz Khas, New Delhi - 110016',
    city: 'Delhi NCR',
    area: 'Hauz Khas Village',
    location: { lat: 28.5494, lng: 77.2001 },
    startingPrice: 1999,
    rating: 4.92,
    totalReviews: 290,
    coverImageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=800&q=80',
    amenitiesList: ['Regulation Boxing Ring', 'Muay Thai Heavy Bags', 'Kettlebell & Free Weight Pit', 'Ice Baths', 'Sports Physiotherapy'],
    facilityType: 'Combat Sports, Boxing & Strength Loft',
    openingHours: 'Mon - Sat: 06:00 AM - 10:00 PM | Sun: 08:00 AM - 01:00 PM',
    isActive: true,
  },
  {
    name: 'Volt High-Performance Strength Loft',
    slug: 'volt-strength-indirapuram',
    tagline: 'Uncompromising Iron • 24/7 Access',
    phone: '9871002233',
    email: 'volt@voltgym.in',
    address: 'Commercial Complex, Ahinsa Khand 2, Indirapuram, NCR - 201014',
    city: 'Noida',
    area: 'Indirapuram (Noida Expressway Corridor)',
    location: { lat: 28.6415, lng: 77.3752 },
    startingPrice: 1699,
    rating: 4.88,
    totalReviews: 340,
    coverImageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80',
    amenitiesList: ['24/7 RFID Turnstiles', 'Eleiko Calibrated Plates', 'Monolift & Squat Cages', 'CrossFit Sled Turf', 'Protein Bar'],
    facilityType: '24/7 Powerlifting & Strongman Hub',
    openingHours: 'Open 24 Hours / 7 Days a Week',
    isActive: true,
  },
  {
    name: 'The Olympic Compound & Aquatics',
    slug: 'olympic-compound-vasantkunj',
    tagline: 'Train Like An Olympian',
    phone: '9910887766',
    email: 'olympic@compound.fit',
    address: 'Pocket 4, Sector B, Near Promenade Mall, Vasant Kunj, New Delhi - 110070',
    city: 'Delhi NCR',
    area: 'Vasant Kunj',
    location: { lat: 28.5398, lng: 77.1534 },
    startingPrice: 3499,
    rating: 4.96,
    totalReviews: 640,
    coverImageUrl: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=800&q=80',
    amenitiesList: ['Olympic Swimming Pool', 'Hammer Strength Zone', 'Hydrotherapy Jacuzzi', 'Running Track', 'Sports Nutrition Clinic', 'Covered Parking'],
    facilityType: 'Olympic Multi-Sport & Fitness Resort',
    openingHours: 'Mon - Sun: 05:00 AM - 11:30 PM',
    isActive: true,
  }
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');
  for (const g of extraGyms) {
    const existing = await Gym.findOne({ slug: g.slug });
    if (!existing) {
      await Gym.create(g);
      console.log('Created gym:', g.name);
    } else {
      console.log('Already exists:', g.name);
    }
  }
  const total = await Gym.countDocuments({ isActive: true });
  console.log('Total active gyms in DB:', total);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
