import FoodOrder from './model.js';
import Booking from '../booking/model.js';
import Room from '../room/model.js';
import Hotel from '../hotel/model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

class FoodOrderController {
  /**
   * Place a new room service food order
   */
  create = asyncHandler(async (req, res) => {
    const { bookingId, items } = req.body;

    if (!bookingId) {
      throw new ApiError(400, 'Booking ID is required');
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'Order items are required and must be a non-empty array');
    }

    // 1. Verify traveler has a confirmed booking for this ID
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
      status: 'Confirmed'
    });

    if (!booking) {
      throw new ApiError(404, 'Active or confirmed room booking not found for this user');
    }

    // 2. Fetch room details to get the room number for delivery
    const room = await Room.findById(booking.room);
    const roomNumber = room ? room.roomNumber : 'Standard Room';

    // 3. Calculate total price on the server
    const totalPrice = items.reduce((sum, item) => {
      const q = parseInt(item.quantity, 10);
      const p = parseFloat(item.price);
      if (isNaN(q) || q <= 0 || isNaN(p) || p < 0) {
        throw new ApiError(400, 'Invalid item quantity or price');
      }
      return sum + (p * q);
    }, 0);

    // 4. Create food order
    const order = await FoodOrder.create({
      user: req.user._id,
      hotel: booking.hotel,
      booking: bookingId,
      roomNumber,
      items,
      totalPrice
    });

    return res
      .status(201)
      .json(new ApiResponse(201, order, 'Food order placed successfully'));
  });

  /**
   * Get traveler's food orders history
   */
  listForUser = asyncHandler(async (req, res) => {
    const orders = await FoodOrder.find({ user: req.user._id })
      .populate({
        path: 'hotel',
        select: 'name address starRating images'
      })
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, orders, 'Traveler food orders retrieved successfully'));
  });

  /**
   * Get host's incoming food orders for their properties
   */
  listForHost = asyncHandler(async (req, res) => {
    // 1. Get all hotels owned by this host
    const hotels = await Hotel.find({ owner: req.user._id });
    const hotelIds = hotels.map(h => h._id);

    // 2. Find orders for these hotels
    const orders = await FoodOrder.find({ hotel: { $in: hotelIds } })
      .populate({
        path: 'user',
        select: 'name email avatar'
      })
      .populate({
        path: 'hotel',
        select: 'name'
      })
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, orders, 'Host incoming food orders retrieved successfully'));
  });

  /**
   * Update food order delivery status (by Host)
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!['Pending', 'Preparing', 'On the way', 'Delivered'].includes(status)) {
      throw new ApiError(400, 'Invalid status update value');
    }

    const order = await FoodOrder.findById(id);
    if (!order) {
      throw new ApiError(404, 'Food order not found');
    }

    // Auth check: verify if current user owns the hotel associated with this order
    const hotel = await Hotel.findById(order.hotel);
    if (!hotel) {
      throw new ApiError(404, 'Hotel associated with this order not found');
    }

    if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'You are not authorized to update status for this order');
    }

    order.status = status;
    await order.save();

    return res
      .status(200)
      .json(new ApiResponse(200, order, 'Food order status updated successfully'));
  });
}

export default new FoodOrderController();
