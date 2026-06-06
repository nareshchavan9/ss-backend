import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  country: { type: String, required: true, trim: true },
  pincode: { type: String, trim: true },
}, { _id: false });

const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
}, { _id: false });

const policiesSchema = new mongoose.Schema({
  checkIn: { type: String, default: '14:00' },
  checkOut: { type: String, default: '12:00' },
  cancellation: { type: String, default: 'Free cancellation within 24 hours' },
}, { _id: false });

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hotel owner is required'],
    },
    address: {
      type: addressSchema,
      required: [true, 'Hotel address is required'],
    },
    location: {
      type: locationSchema,
      required: [true, 'Hotel coordinates (longitude, latitude) are required'],
    },
    starRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      required: [true, 'Star rating is required'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [{
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      }],
      default: [],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    policies: {
      type: policiesSchema,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// For geo queries using $nearSphere
hotelSchema.index({ location: '2dsphere' });

// Compound index for optimized filtering
hotelSchema.index({ 'address.city': 1, starRating: -1, isActive: 1 });

const Hotel = mongoose.model('Hotel', hotelSchema);

export default Hotel;
