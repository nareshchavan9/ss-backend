import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel ID is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room ID is required'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    checkIn: {
      type: String,
      required: [true, 'Check-in date is required'],
    },
    checkOut: {
      type: String,
      required: [true, 'Check-out date is required'],
    },
    guests: {
      type: String,
      required: [true, 'Number of guests is required'],
    },
    nights: {
      type: Number,
      required: [true, 'Nights is required'],
      min: 1,
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: 0,
    },
    serviceFee: {
      type: Number,
      required: [true, 'Service fee is required'],
      min: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total price is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Pending',
    },
    payoutStatus: {
      type: String,
      enum: ['Pending Approval', 'Settled'],
      default: 'Pending Approval',
    },
    requests: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Optimize lookups by user and hotel (host queries)
bookingSchema.index({ user: 1 });
bookingSchema.index({ hotel: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
