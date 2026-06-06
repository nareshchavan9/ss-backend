import mongoose from 'mongoose';
import User from '../modules/auth/model.js';
import Hotel from '../modules/hotel/model.js';
import Room from '../modules/room/model.js';
import winston from 'winston';

const defaultOwner = {
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
  name: 'Lumina Owner',
  email: 'owner@sanchara.com',
  role: 'HOTEL_OWNER',
  password: 'password123', // Will be hashed by pre-save hook
  isVerified: true
};

const defaultHotels = [
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
    name: 'The Azure Pavilion',
    description: 'An architectural masterpiece nestled on the edge of the sapphire coast. The Azure Pavilion offers an unparalleled sanctuary where modernist design meets the raw beauty of the shoreline.',
    starRating: 5,
    averageRating: 4.9,
    totalReviews: 124,
    address: { city: 'North Malé Atoll', country: 'Maldives' },
    location: { type: 'Point', coordinates: [73.5, 4.2] },
    amenities: ['Pool', 'Spa', 'Fine Dining', 'Gym'],
    owner: defaultOwner._id,
    images: [{
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9Vyd3zQJN1bsCNKoybmYimsRCAq4TiAnKxiaqh1tcMlPVY7aNOPYRwgFXRbTaeSpkaMj8mB00aVDOhHB22Bof42UqGsjl1uLTw8In7Go72mHJqN37gl90Hbxv-kw1Cy6Y7Z7DA6bizRTOX4_vpsd92ctV-QwDIrbiF0YD-sAV57gIEaOJ-MfvrQR2vYq-RjXmZSDOMu5Jb7YHjKnyqOgemQr44H47whXskMTKjJDNIIohdAKKTu-dJKleALPZvf0TqDcgkz5ZIdmC',
      public_id: 'azure_main'
    }]
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),
    name: 'Ubud Jungle Sanctuary',
    description: 'A lush, tropical infinity pool overlooking a deep jungle ravine in Bali.',
    starRating: 5,
    averageRating: 4.8,
    totalReviews: 86,
    address: { city: 'Ubud', country: 'Bali' },
    location: { type: 'Point', coordinates: [115.2, -8.5] },
    amenities: ['Pool', 'Yoga Deck', 'Vegan Café', 'Spa'],
    owner: defaultOwner._id,
    images: [{
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTeSYgVJsR2M43ZeW5B9OXpbP3xjRfmrA3RntvlQmvv003SxSUaDtGkm0sZjP6oSOAeuUl9Xa05VXfOG6l-NyhDVWnIgjorGpQ9PZvDgnZG96jj24_zdoByQ19oMDjClv4BAxR94iMjtzUZfwCO8ljdytaAjpjZsl1DbeU2eFlv7_7j2YY1fCYQW6QEptQnjbQiRoLWToynGRm5dQJoLwK760EyJig41YmorlbSpvd88Yw8sZw4NDzTzyfgubq22E9OTlS9w4CegRz',
      public_id: 'ubud_main'
    }]
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439015'),
    name: 'Kyoto Zen Ryokan',
    description: 'A traditional Zen garden ryokan featuring cedar pavilions and hot spring baths.',
    starRating: 4,
    averageRating: 4.7,
    totalReviews: 92,
    address: { city: 'Kyoto', country: 'Japan' },
    location: { type: 'Point', coordinates: [135.7, 35.0] },
    amenities: ['Onsen', 'Zen Garden', 'Tea Room', 'WiFi'],
    owner: defaultOwner._id,
    images: [{
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlq-dUnLZPnueEBM7ijYAofJ0D6gmR6EjQ8v2hdua-4yr4DhsbFLSm48lGWbxZK2cNZhrkWaKwlIiOQrALHLy2iwb12BN4nyyO5Font4z_jCsc1BP5dqWWfzwiL2Hmq_O1Skso3b_F53roZHVUg6SpYjRGWhdf-kMh98upPKR1b_QWZsGJpGec0LWB7QRu4k5nmVGOPo0P-Ps0nAui-slMY8AEyjMFMrIPMsJ0sPWidNuMwoFgBCMnTDpsfFrRjLqAxhhqAE5mJxtb',
      public_id: 'kyoto_main'
    }]
  }
];

const defaultRooms = [
  // Hotel 1 Rooms
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439021'),
    hotel: defaultHotels[0]._id,
    roomNumber: '101A',
    type: 'Deluxe',
    description: 'Deluxe Ocean Suite. 45 sqm • King Bed • Ocean View • Private Balcony',
    pricePerNight: 450,
    bedType: 'King',
    size: 45,
    amenities: ['Ocean View', 'Private Balcony', 'King Bed'],
    images: [{ url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-ryRKGtL3Op35Dh1Ty84GNqFYNaHX8-eK_ogCboZ0iNFu0ZD6AL0fVWzHiNcBYWSqXXIgXP232zuJ8VRmhOb9gstaWFzcp9a_W7kQz2RIPdaCSBMIYtijhtiz4JA7J5bH4Qa_riLGaN_B1SBRH8QOcmIX-aAknm6F0E69RDfnCFhQtvfIDH3aBdcnUuL7Aev2oxi3vuz_INfDH2ruOKrDgP-wfTQlbwy-U3EiI4SaIwbhTx8FjEPoO4DPuPLfNfr_tj-fOm3sj5Mv', public_id: 'room_101a' }]
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
    hotel: defaultHotels[0]._id,
    roomNumber: '202B',
    type: 'Suite',
    description: 'Executive Horizon Studio. 72 sqm • King Bed • Panoramic View • Smart Concierge',
    pricePerNight: 680,
    bedType: 'King',
    size: 72,
    amenities: ['Panoramic View', 'Smart Concierge', 'King Bed'],
    images: [{ url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmNE5cANX4nEIODMd3lI_fILr_t6a2qnJ85NS5Y5C2T25zZIg4Bv2esuU4XJMnPohwoSU2BUum9eAC0o8AbARmQ_voIlTEkQH3MZR7a47-sECyPmKfQrUGNFh8gF_CoZ7epc9uc7LvFd3Y4fnyumsAkSTre68zevGQ05RCGiSC2GUvCQyZoeAV-sxjR5RLZN7UfrMeJy7ai8ZQyeoa7puSYD8XreoP6kHspxKcl-8DSZ_mjSQ11aovepQjE_yC7cic-9PBYiEB3BL_', public_id: 'room_202b' }]
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439023'),
    hotel: defaultHotels[0]._id,
    roomNumber: 'PH01',
    type: 'Suite',
    description: 'The Azure Penthouse. 120 sqm • Private Terrace • Butler Service • Premium Bar',
    pricePerNight: 1200,
    bedType: 'King',
    size: 120,
    amenities: ['Private Terrace', 'Butler Service', 'Premium Bar', 'King Bed'],
    images: [{ url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCi7-iyMZxr9arIQ51fcUY3PrxRDNKwfECYTqcoCKTV9HwWBnMnICyyRb5ipYdPgxGIyn-pfBGeA9mwHDMDYzRwQV4QeikFmc4ZKotxFOnlNic3wRjNqg1dzjRHv7Ib9_Fwmv0aTKpcfXiHBQmW7M-YsIAgtdHzD6JZz2hd-mXJmDDcdrZv_qD-SevexR5VEm6Gdaeqd1Yi-HwXps1ZPlR181IysEkmG5NNHcYRgjhs1S4QKpV8KkVDEFassH-ghx7I4lGT70xRMtSd', public_id: 'room_ph01' }]
  },
  // Hotel 2 Rooms
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439024'),
    hotel: defaultHotels[1]._id,
    roomNumber: '101A',
    type: 'Deluxe',
    description: 'Deluxe Ocean Suite. 45 sqm • King Bed • Ocean View • Private Balcony',
    pricePerNight: 450,
    bedType: 'King',
    size: 45,
    amenities: ['Ocean View', 'Private Balcony', 'King Bed'],
    images: [{ url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-ryRKGtL3Op35Dh1Ty84GNqFYNaHX8-eK_ogCboZ0iNFu0ZD6AL0fVWzHiNcBYWSqXXIgXP232zuJ8VRmhOb9gstaWFzcp9a_W7kQz2RIPdaCSBMIYtijhtiz4JA7J5bH4Qa_riLGaN_B1SBRH8QOcmIX-aAknm6F0E69RDfnCFhQtvfIDH3aBdcnUuL7Aev2oxi3vuz_INfDH2ruOKrDgP-wfTQlbwy-U3EiI4SaIwbhTx8FjEPoO4DPuPLfNfr_tj-fOm3sj5Mv', public_id: 'room_101a' }]
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439025'),
    hotel: defaultHotels[1]._id,
    roomNumber: '202B',
    type: 'Suite',
    description: 'Executive Horizon Studio. 72 sqm • King Bed • Panoramic View • Smart Concierge',
    pricePerNight: 680,
    bedType: 'King',
    size: 72,
    amenities: ['Panoramic View', 'Smart Concierge', 'King Bed'],
    images: [{ url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmNE5cANX4nEIODMd3lI_fILr_t6a2qnJ85NS5Y5C2T25zZIg4Bv2esuU4XJMnPohwoSU2BUum9eAC0o8AbARmQ_voIlTEkQH3MZR7a47-sECyPmKfQrUGNFh8gF_CoZ7epc9uc7LvFd3Y4fnyumsAkSTre68zevGQ05RCGiSC2GUvCQyZoeAV-sxjR5RLZN7UfrMeJy7ai8ZQyeoa7puSYD8XreoP6kHspxKcl-8DSZ_mjSQ11aovepQjE_yC7cic-9PBYiEB3BL_', public_id: 'room_202b' }]
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439026'),
    hotel: defaultHotels[1]._id,
    roomNumber: 'PH01',
    type: 'Suite',
    description: 'The Azure Penthouse. 120 sqm • Private Terrace • Butler Service • Premium Bar',
    pricePerNight: 1200,
    bedType: 'King',
    size: 120,
    amenities: ['Private Terrace', 'Butler Service', 'Premium Bar', 'King Bed'],
    images: [{ url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCi7-iyMZxr9arIQ51fcUY3PrxRDNKwfECYTqcoCKTV9HwWBnMnICyyRb5ipYdPgxGIyn-pfBGeA9mwHDMDYzRwQV4QeikFmc4ZKotxFOnlNic3wRjNqg1dzjRHv7Ib9_Fwmv0aTKpcfXiHBQmW7M-YsIAgtdHzD6JZz2hd-mXJmDDcdrZv_qD-SevexR5VEm6Gdaeqd1Yi-HwXps1ZPlR181IysEkmG5NNHcYRgjhs1S4QKpV8KkVDEFassH-ghx7I4lGT70xRMtSd', public_id: 'room_ph01' }]
  },
  // Hotel 3 Rooms
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439027'),
    hotel: defaultHotels[2]._id,
    roomNumber: '101A',
    type: 'Deluxe',
    description: 'Deluxe Ocean Suite. 45 sqm • King Bed • Ocean View • Private Balcony',
    pricePerNight: 450,
    bedType: 'King',
    size: 45,
    amenities: ['Ocean View', 'Private Balcony', 'King Bed'],
    images: [{ url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-ryRKGtL3Op35Dh1Ty84GNqFYNaHX8-eK_ogCboZ0iNFu0ZD6AL0fVWzHiNcBYWSqXXIgXP232zuJ8VRmhOb9gstaWFzcp9a_W7kQz2RIPdaCSBMIYtijhtiz4JA7J5bH4Qa_riLGaN_B1SBRH8QOcmIX-aAknm6F0E69RDfnCFhQtvfIDH3aBdcnUuL7Aev2oxi3vuz_INfDH2ruOKrDgP-wfTQlbwy-U3EiI4SaIwbhTx8FjEPoO4DPuPLfNfr_tj-fOm3sj5Mv', public_id: 'room_101a' }]
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439028'),
    hotel: defaultHotels[2]._id,
    roomNumber: '202B',
    type: 'Suite',
    description: 'Executive Horizon Studio. 72 sqm • King Bed • Panoramic View • Smart Concierge',
    pricePerNight: 680,
    bedType: 'King',
    size: 72,
    amenities: ['Panoramic View', 'Smart Concierge', 'King Bed'],
    images: [{ url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmNE5cANX4nEIODMd3lI_fILr_t6a2qnJ85NS5Y5C2T25zZIg4Bv2esuU4XJMnPohwoSU2BUum9eAC0o8AbARmQ_voIlTEkQH3MZR7a47-sECyPmKfQrUGNFh8gF_CoZ7epc9uc7LvFd3Y4fnyumsAkSTre68zevGQ05RCGiSC2GUvCQyZoeAV-sxjR5RLZN7UfrMeJy7ai8ZQyeoa7puSYD8XreoP6kHspxKcl-8DSZ_mjSQ11aovepQjE_yC7cic-9PBYiEB3BL_', public_id: 'room_202b' }]
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439029'),
    hotel: defaultHotels[2]._id,
    roomNumber: 'PH01',
    type: 'Suite',
    description: 'The Azure Penthouse. 120 sqm • Private Terrace • Butler Service • Premium Bar',
    pricePerNight: 1200,
    bedType: 'King',
    size: 120,
    amenities: ['Private Terrace', 'Butler Service', 'Premium Bar', 'King Bed'],
    images: [{ url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCi7-iyMZxr9arIQ51fcUY3PrxRDNKwfECYTqcoCKTV9HwWBnMnICyyRb5ipYdPgxGIyn-pfBGeA9mwHDMDYzRwQV4QeikFmc4ZKotxFOnlNic3wRjNqg1dzjRHv7Ib9_Fwmv0aTKpcfXiHBQmW7M-YsIAgtdHzD6JZz2hd-mXJmDDcdrZv_qD-SevexR5VEm6Gdaeqd1Yi-HwXps1ZPlR181IysEkmG5NNHcYRgjhs1S4QKpV8KkVDEFassH-ghx7I4lGT70xRMtSd', public_id: 'room_ph01' }]
  }
];

export async function seedDatabase() {
  try {
    winston.info('Checking database for seeding...');

    // 1. Seed Owner User
    const ownerExists = await User.findById(defaultOwner._id);
    if (!ownerExists) {
      await User.create(defaultOwner);
      winston.info('Default owner user seeded successfully');
    }

    // 2. Seed Hotels
    for (const hotelData of defaultHotels) {
      const hotelExists = await Hotel.findById(hotelData._id);
      if (!hotelExists) {
        await Hotel.create(hotelData);
        winston.info(`Hotel seeded successfully: ${hotelData.name}`);
      }
    }

    // 3. Seed Rooms
    for (const roomData of defaultRooms) {
      const roomExists = await Room.findById(roomData._id);
      if (!roomExists) {
        await Room.create(roomData);
        winston.info(`Room seeded successfully: ${roomData.roomNumber} for hotel ${roomData.hotel}`);
      }
    }

    winston.info('Database seeding complete');
  } catch (error) {
    winston.error(`Database seeding failed: ${error.message}`);
  }
}
