import Booking from './model.js';
import Hotel from '../hotel/model.js';
import Room from '../room/model.js';
import ApiError from '../../utils/ApiError.js';

class BookingService {
  /**
   * Create a new booking
   * @param {Object} bookingData 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async createBooking(bookingData, userId) {
    const { hotel: hotelId, room: roomId } = bookingData;

    // Verify hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new ApiError(404, 'Hotel not found');
    }

    // Verify room exists and belongs to the hotel
    const room = await Room.findOne({ _id: roomId, hotel: hotelId, isDeleted: false });
    if (!room) {
      throw new ApiError(404, 'Room not found in the specified hotel');
    }

    // Create the booking
    const booking = await Booking.create({
      ...bookingData,
      user: userId,
    });

    return booking;
  }

  /**
   * Get all bookings for hotels owned by a specific host
   * @param {string} hostId 
   * @returns {Promise<Object[]>}
   */
  async getHostBookings(hostId) {
    // Find all hotels owned by this host
    const hotels = await Hotel.find({ owner: hostId });
    const hotelIds = hotels.map(h => h._id);

    // Get bookings for these hotels
    const bookings = await Booking.find({ hotel: { $in: hotelIds } })
      .populate('user', 'name email')
      .populate('hotel', 'name address starRating images')
      .populate('room', 'roomNumber type pricePerNight discountedPrice')
      .sort({ createdAt: -1 });

    return bookings;
  }

  /**
   * Get all bookings made by a traveler
   * @param {string} travelerId 
   * @returns {Promise<Object[]>}
   */
  async getTravelerBookings(travelerId) {
    const bookings = await Booking.find({ user: travelerId })
      .populate('hotel', 'name address starRating images')
      .populate('room', 'roomNumber type pricePerNight discountedPrice')
      .sort({ createdAt: -1 });

    return bookings;
  }

  /**
   * Update the status of a booking (approve/cancel)
   * @param {string} bookingId 
   * @param {string} status 
   * @param {string} userId 
   * @param {string} userRole 
   * @returns {Promise<Object>}
   */
  async updateBookingStatus(bookingId, status, userId, userRole) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    // Verify authorization: User must be Admin, Owner of the hotel, or the booking creator
    const hotel = await Hotel.findById(booking.hotel);
    if (!hotel) {
      throw new ApiError(404, 'Associated hotel not found');
    }

    const isBookingCreator = booking.user.toString() === userId.toString();
    const isHotelOwner = hotel.owner.toString() === userId.toString();
    const isAdmin = userRole === 'ADMIN';

    if (!isBookingCreator && !isHotelOwner && !isAdmin) {
      throw new ApiError(403, 'You are not authorized to update this reservation');
    }

    // Travelers can ONLY cancel their own booking
    if (isBookingCreator && !isHotelOwner && !isAdmin && status !== 'Cancelled') {
      throw new ApiError(403, 'Travelers can only cancel their own reservations');
    }

    booking.status = status;
    
    // Automatically settle payout if Confirmed (just to make the dashboard statistics feel alive and match UI)
    if (status === 'Confirmed') {
      booking.payoutStatus = 'Settled';
    } else if (status === 'Cancelled') {
      booking.payoutStatus = 'Pending Approval'; // or keep as is
    }

    await booking.save();
    return booking;
  }
}

export default new BookingService();
