import WishlistService from './service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class WishlistController {
  toggle = asyncHandler(async (req, res) => {
    const { hotelId } = req.body;
    const result = await WishlistService.toggleWishlist(hotelId, req.user._id);
    const message = result.toggled
      ? 'Hotel added to wishlist successfully'
      : 'Hotel removed from wishlist successfully';
    return res
      .status(200)
      .json(new ApiResponse(200, result, message));
  });

  list = asyncHandler(async (req, res) => {
    const wishlist = await WishlistService.getWishlist(req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, wishlist, 'User wishlist retrieved successfully'));
  });
}

export default new WishlistController();
