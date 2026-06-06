import mongoose from 'mongoose';

const capacitySchema = new mongoose.Schema({
  adults: { type: Number, required: true, default: 2 },
  children: { type: Number, default: 0 },
}, { _id: false });

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel ID is required'],
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Single', 'Double', 'Suite', 'Deluxe', 'Family'],
      required: [true, 'Room type is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price per night cannot be negative'],
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Discounted price cannot be negative'],
    },
    capacity: {
      type: capacitySchema,
      required: true,
      default: {},
    },
    bedType: {
      type: String,
      enum: ['Single', 'Double', 'Twin', 'King', 'Queen'],
      required: [true, 'Bed type is required'],
    },
    size: {
      type: Number, // sq ft
      min: 0,
    },
    floor: {
      type: Number,
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
    isAvailable: {
      type: Boolean,
      default: true,
    },
    maxBookings: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of roomNumber per hotel (ignoring soft-deleted ones)
roomSchema.index({ hotel: 1, roomNumber: 1, isDeleted: 1 });

// Validate discountedPrice is less than pricePerNight
roomSchema.pre('save', function (next) {
  if (this.discountedPrice !== undefined && this.discountedPrice !== null) {
    if (this.discountedPrice >= this.pricePerNight) {
      return next(new Error('Discounted price must be less than the price per night'));
    }
  }
  next();
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
