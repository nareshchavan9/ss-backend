import Review from './model.js';
import Hotel from '../hotel/model.js';
import ApiError from '../../utils/ApiError.js';

class ReviewService {
  /**
   * Create a new review and update the associated hotel's rating statistics
   */
  async createReview(reviewData, userId) {
    const { hotel: hotelId, rating, comment } = reviewData;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new ApiError(404, 'Hotel not found');
    }

    const review = await Review.create({
      hotel: hotelId,
      user: userId,
      rating,
      comment,
    });

    // Recalculate hotel's reviews stats
    const allReviews = await Review.find({ hotel: hotelId });
    const totalReviews = allReviews.length;
    const ratingSum = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalReviews > 0 ? ratingSum / totalReviews : 0;

    hotel.totalReviews = totalReviews;
    hotel.averageRating = Math.round(averageRating * 100) / 100;
    await hotel.save();

    return review;
  }

  /**
   * Fetch all reviews left on hotels owned by a host
   */
  async getHostReviews(hostId) {
    const hotels = await Hotel.find({ owner: hostId });
    const hotelIds = hotels.map(h => h._id);

    const reviews = await Review.find({ hotel: { $in: hotelIds } })
      .populate('user', 'name email avatar')
      .populate('hotel', 'name address')
      .sort({ createdAt: -1 });

    return reviews;
  }

  /**
   * Add response from the host to a review
   */
  async submitReply(reviewId, replyText, hostId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    const hotel = await Hotel.findById(review.hotel);
    if (!hotel) {
      throw new ApiError(404, 'Hotel associated with review not found');
    }

    if (hotel.owner.toString() !== hostId.toString()) {
      throw new ApiError(403, 'You are not authorized to respond to reviews for this hotel');
    }

    review.reply = replyText;
    await review.save();
    return review;
  }
}

export default new ReviewService();
