import mongoose from 'mongoose';

const payoutMethodSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    type: {
      type: String,
      enum: ['Bank Transfer', 'PayPal'],
      required: [true, 'Payout type is required'],
    },
    name: {
      type: String,
      required: [true, 'Payout method name is required'],
      trim: true,
    },
    details: {
      type: String,
      required: [true, 'Payout details are required'],
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const paymentCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    cardholder: {
      type: String,
      required: [true, 'Cardholder name is required'],
      trim: true,
    },
    number: {
      type: String,
      required: [true, 'Card number is required'],
      trim: true,
    },
    expiry: {
      type: String,
      required: [true, 'Expiry date is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Card type is required'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Card color theme is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
payoutMethodSchema.index({ owner: 1 });
paymentCardSchema.index({ user: 1 });

export const PayoutMethod = mongoose.model('PayoutMethod', payoutMethodSchema);
export const PaymentCard = mongoose.model('PaymentCard', paymentCardSchema);
