import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    targetAudience: {
      type: String,
      enum: ['EVERYONE', 'USER', 'HOTEL_OWNER'],
      default: 'EVERYONE',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Broadcast = mongoose.model('Broadcast', broadcastSchema);
export default Broadcast;
