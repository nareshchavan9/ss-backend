import BookingService from './service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class BookingController {
  create = asyncHandler(async (req, res) => {
    const booking = await BookingService.createBooking(req.body, req.user._id);
    return res
      .status(201)
      .json(new ApiResponse(201, booking, 'Booking created successfully'));
  });

  listHostBookings = asyncHandler(async (req, res) => {
    const bookings = await BookingService.getHostBookings(req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, bookings, 'Host reservations retrieved successfully'));
  });

  listTravelerBookings = asyncHandler(async (req, res) => {
    const bookings = await BookingService.getTravelerBookings(req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, bookings, 'Traveler bookings retrieved successfully'));
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const updatedBooking = await BookingService.updateBookingStatus(
      req.params.id,
      status,
      req.user._id,
      req.user.role
    );
    return res
      .status(200)
      .json(new ApiResponse(200, updatedBooking, `Booking status updated to ${status} successfully`));
  });
}

export default new BookingController();
