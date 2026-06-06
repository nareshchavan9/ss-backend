import Wishlist from './model.js';
import Hotel from '../hotel/model.js';
import ApiError from '../../utils/ApiError.js';

class WishlistService {
  /**
   * Toggle a hotel in the user's wishlist
   * @param {string} hotelId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async toggleWishlist(hotelId, userId) {
    const existing = await Wishlist.findOne({ hotel: hotelId, user: userId });
    
    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return { toggled: false };
    }

    // Verify hotel exists before adding to wishlist
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new ApiError(404, 'Hotel not found');
    }

    const wishlist = await Wishlist.create({
      hotel: hotelId,
      user: userId,
    });

    return { toggled: true, wishlist };
  }

  /**
   * Get all wishlist items for a user
   * @param {string} userId 
   * @returns {Promise<Object[]>}
   */
  async getWishlist(userId) {
    const wishlistItems = await Wishlist.find({ user: userId })
      .populate({
        path: 'hotel',
        select: 'name description starRating averageRating totalReviews address images'
      })
      .sort({ createdAt: -1 });

    // Filter out items where the hotel might have been deleted
    return wishlistItems.filter(item => item.hotel !== null);
  }
}

export default new WishlistService();
