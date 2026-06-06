import Hotel from './model.js';
import ApiError from '../../utils/ApiError.js';
import { cacheService } from '../../config/redis.js';
import redisClient from '../../config/redis.js';
import { getPagination, getPaginationMeta } from '../../utils/pagination.js';

class HotelService {
  /**
   * Invalidate all hotel cache keys
   */
  async clearHotelCache() {
    if (!redisClient || redisClient.status !== 'ready') return;
    try {
      const keys = await redisClient.keys('hotels:*');
      if (keys.length > 0) {
        await cacheService.deleteCache(keys);
      }
    } catch (error) {
      console.error('Failed to clear hotel cache:', error);
    }
  }

  /**
   * Create a new hotel
   * @param {Object} hotelData 
   * @param {string} ownerId 
   * @returns {Promise<Object>}
   */
  async createHotel(hotelData, ownerId) {
    const hotel = await Hotel.create({
      ...hotelData,
      owner: ownerId,
      isActive: true,
    });

    await this.clearHotelCache();
    return hotel;
  }

  /**
   * Get hotel details by ID
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async getHotelById(id) {
    const hotel = await Hotel.findById(id).populate('owner', 'name email avatar');
    if (!hotel || !hotel.isActive) {
      throw new ApiError(404, 'Hotel not found or is inactive');
    }
    return hotel;
  }

  /**
   * Update hotel details
   * @param {string} id 
   * @param {Object} updateData 
   * @param {string} userId 
   * @param {string} userRole 
   * @returns {Promise<Object>}
   */
  async updateHotel(id, updateData, userId, userRole) {
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      throw new ApiError(404, 'Hotel not found');
    }

    // Auth check: Only owner or admin can update
    if (hotel.owner.toString() !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You are not authorized to update this hotel');
    }

    // Perform update
    const updatedHotel = await Hotel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    await this.clearHotelCache();
    return updatedHotel;
  }

  /**
   * Soft delete a hotel
   * @param {string} id 
   * @param {string} userRole 
   * @returns {Promise<Object>}
   */
  async deleteHotel(id, userRole) {
    if (userRole !== 'ADMIN') {
      throw new ApiError(403, 'Only admins are authorized to soft-delete hotels');
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      throw new ApiError(404, 'Hotel not found');
    }

    hotel.isActive = false;
    await hotel.save();

    await this.clearHotelCache();
    return hotel;
  }

  /**
   * Add image to hotel
   */
  async addImage(id, image, userId, userRole) {
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      throw new ApiError(404, 'Hotel not found');
    }

    if (hotel.owner.toString() !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You are not authorized to manage images for this hotel');
    }

    if (hotel.images.length >= 10) {
      throw new ApiError(400, 'Maximum of 10 images are allowed per hotel');
    }

    hotel.images.push(image);
    await hotel.save();
    await this.clearHotelCache();
    return hotel;
  }

  /**
   * Delete image from hotel
   */
  async removeImage(id, imageId, userId, userRole) {
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      throw new ApiError(404, 'Hotel not found');
    }

    if (hotel.owner.toString() !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You are not authorized to manage images for this hotel');
    }

    const image = hotel.images.id(imageId);
    if (!image) {
      throw new ApiError(404, 'Image not found');
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(image.public_id);

    // Remove from array
    hotel.images.pull(imageId);
    await hotel.save();
    await this.clearHotelCache();
    return hotel;
  }

  /**
   * List/Search Hotels with filters, pagination, and sorting
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async searchHotels(filters) {
    // Generate cache key
    const cacheKey = `hotels:${JSON.stringify(filters)}`;
    const cachedData = await cacheService.getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const {
      city,
      country,
      starRating,
      minRating,
      amenities,
      page: queryPage,
      limit: queryLimit,
      sortBy,
      lat,
      lng,
      radius,
      owner,
    } = filters;

    const { page, limit, skip } = getPagination(queryPage, queryLimit);

    // Build standard matching query
    const matchQuery = { isActive: true };

    if (owner) {
      matchQuery.owner = owner;
    }
    if (city) {
      matchQuery['address.city'] = { $regex: new RegExp(city, 'i') };
    }
    if (country) {
      matchQuery['address.country'] = { $regex: new RegExp(country, 'i') };
    }
    if (starRating) {
      matchQuery.starRating = starRating;
    }
    if (minRating) {
      matchQuery.averageRating = { $gte: minRating };
    }
    if (amenities) {
      const amenitiesList = amenities.split(',').map((a) => a.trim());
      matchQuery.amenities = { $all: amenitiesList };
    }

    // Geolocation search using $nearSphere
    if (lat !== undefined && lng !== undefined) {
      const maxDistance = (radius || 10) * 1000; // default 10km in meters
      matchQuery.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat], // longitude first
          },
          $maxDistance: maxDistance,
        },
      };
    }

    let hotels;
    let totalItems;

    // Handle Lookup sort by price (which is inside Room model)
    if (sortBy === 'price') {
      // For $nearSphere in aggregation pipelines:
      // Geo near stage MUST be the first stage in the pipeline!
      const pipeline = [];

      if (lat !== undefined && lng !== undefined) {
        pipeline.push({
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distance',
            maxDistance: (radius || 10) * 1000,
            query: { ...matchQuery, location: undefined }, // remove location query to avoid redundancy
            spherical: true,
          },
        });
      } else {
        pipeline.push({ $match: matchQuery });
      }

      // Lookup rooms
      pipeline.push({
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'hotel',
          as: 'rooms',
        },
      });

      // Filter out soft-deleted rooms and get minimum price
      pipeline.push({
        $addFields: {
          activeRooms: {
            $filter: {
              input: '$rooms',
              as: 'room',
              cond: { $ne: ['$$room.isDeleted', true] },
            },
          },
        },
      });

      pipeline.push({
        $addFields: {
          minPrice: {
            $cond: {
              if: { $gt: [{ $size: '$activeRooms' }, 0] },
              then: { $min: '$activeRooms.pricePerNight' },
              else: Number.MAX_SAFE_INTEGER, // Place hotels without rooms at the bottom
            },
          },
        },
      });

      // Sort by minPrice
      pipeline.push({ $sort: { minPrice: 1 } });

      // Get count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Hotel.aggregate(countPipeline);
      totalItems = countResult.length > 0 ? countResult[0].total : 0;

      // Pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      hotels = await Hotel.aggregate(pipeline);
    } else {
      // Standard query path
      const query = Hotel.find(matchQuery);

      // Sorting
      if (sortBy === 'rating') {
        query.sort({ averageRating: -1, starRating: -1 });
      } else if (sortBy === 'newest') {
        query.sort({ createdAt: -1 });
      }

      totalItems = await Hotel.countDocuments(matchQuery);

      query.skip(skip).limit(limit);
      hotels = await query.exec();
    }

    const paginationMeta = getPaginationMeta(totalItems, page, limit);
    const result = { hotels, pagination: paginationMeta };

    // Cache results (TTL: 5 min / 300s)
    await cacheService.setCache(cacheKey, result, 300);

    return result;
  }
}

import { deleteFromCloudinary } from '../../config/cloudinary.js';

export default new HotelService();
