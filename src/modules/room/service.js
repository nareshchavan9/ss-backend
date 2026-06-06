import Room from './model.js';
import Hotel from '../hotel/model.js';
import ApiError from '../../utils/ApiError.js';
import { deleteFromCloudinary } from '../../config/cloudinary.js';

class RoomService {
  /**
   * Helper to verify if user has authorization over a hotel
   */
  async verifyHotelAccess(hotelId, userId, userRole) {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new ApiError(404, 'Hotel not found');
    }
    if (hotel.owner.toString() !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You are not authorized to perform this operation on this hotel');
    }
    return hotel;
  }

  /**
   * Create a new room
   * @param {string} hotelId 
   * @param {Object} roomData 
   * @param {string} userId 
   * @param {string} userRole 
   * @returns {Promise<Object>}
   */
  async addRoom(hotelId, roomData, userId, userRole) {
    await this.verifyHotelAccess(hotelId, userId, userRole);

    const room = await Room.create({
      ...roomData,
      hotel: hotelId,
    });

    return room;
  }

  /**
   * List all active rooms for a hotel
   * @param {string} hotelId 
   * @returns {Promise<Object[]>}
   */
  async getRoomsByHotel(hotelId) {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel || !hotel.isActive) {
      throw new ApiError(404, 'Hotel not found or is inactive');
    }

    const rooms = await Room.find({ hotel: hotelId, isDeleted: false });
    return rooms;
  }

  /**
   * Retrieve specific room detail
   * @param {string} hotelId 
   * @param {string} roomId 
   * @returns {Promise<Object>}
   */
  async getRoomDetail(hotelId, roomId) {
    const room = await Room.findOne({ _id: roomId, hotel: hotelId, isDeleted: false }).populate('hotel', 'name address');
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }
    return room;
  }

  /**
   * Update room details
   */
  async updateRoom(hotelId, roomId, updateData, userId, userRole) {
    await this.verifyHotelAccess(hotelId, userId, userRole);

    const room = await Room.findOne({ _id: roomId, hotel: hotelId, isDeleted: false });
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    // Merge updates
    Object.assign(room, updateData);
    await room.save();
    return room;
  }

  /**
   * Soft delete room (Admin only)
   */
  async deleteRoom(hotelId, roomId, userRole) {
    if (userRole !== 'ADMIN') {
      throw new ApiError(403, 'Only admins are authorized to soft-delete rooms');
    }

    const room = await Room.findOne({ _id: roomId, hotel: hotelId, isDeleted: false });
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    room.isDeleted = true;
    await room.save();
    return room;
  }

  /**
   * Add image to room
   */
  async addImage(hotelId, roomId, image, userId, userRole) {
    await this.verifyHotelAccess(hotelId, userId, userRole);

    const room = await Room.findOne({ _id: roomId, hotel: hotelId, isDeleted: false });
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    if (room.images.length >= 8) {
      throw new ApiError(400, 'Maximum of 8 images are allowed per room');
    }

    room.images.push(image);
    await room.save();
    return room;
  }

  /**
   * Check Room Availability with filtering options
   * @param {Object} filters 
   * @returns {Promise<Object[]>} Available rooms matching specifications
   */
  async checkAvailability(filters) {
    const {
      hotelId,
      checkIn, // Reserved for future booking validations
      checkOut, // Reserved for future booking validations
      adults,
      children,
      type,
      minPrice,
      maxPrice,
    } = filters;

    const query = {
      isAvailable: true,
      isDeleted: false,
    };

    if (hotelId) {
      query.hotel = hotelId;
    }
    if (type) {
      query.type = type;
    }
    if (adults !== undefined) {
      query['capacity.adults'] = { $gte: adults };
    }
    if (children !== undefined) {
      query['capacity.children'] = { $gte: children };
    }

    // Filter price by checking both pricePerNight and discountedPrice
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilters = [];
      const standardFilter = {};
      const discountFilter = {};

      if (minPrice !== undefined) {
        standardFilter.$gte = minPrice;
        discountFilter.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        standardFilter.$lte = maxPrice;
        discountFilter.$lte = maxPrice;
      }

      // Check standard price
      priceFilters.push({ pricePerNight: standardFilter });
      // Check discount price (if present)
      priceFilters.push({ discountedPrice: discountFilter });

      query.$or = priceFilters;
    }

    const availableRooms = await Room.find(query).populate('hotel', 'name starRating address location');
    return availableRooms;
  }
}

export default new RoomService();
