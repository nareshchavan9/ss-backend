import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const foodOrderSchema = new mongoose.Schema(
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
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: [
        {
          validator: (val) => val.length > 0,
          message: 'Order must contain at least one food item'
        }
      ]
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'On the way', 'Delivered'],
      default: 'Pending',
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
foodOrderSchema.index({ user: 1 });
foodOrderSchema.index({ hotel: 1 });
foodOrderSchema.index({ booking: 1 });

const FoodOrder = mongoose.model('FoodOrder', foodOrderSchema);

export default FoodOrder;
