import ReviewService from './service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class ReviewController {
  create = asyncHandler(async (req, res) => {
    const review = await ReviewService.createReview(req.body, req.user._id);
    return res
      .status(201)
      .json(new ApiResponse(201, review, 'Review created successfully'));
  });

  listHostReviews = asyncHandler(async (req, res) => {
    const reviews = await ReviewService.getHostReviews(req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, reviews, 'Host reviews retrieved successfully'));
  });

  reply = asyncHandler(async (req, res) => {
    const { reply } = req.body;
    const updatedReview = await ReviewService.submitReply(req.params.id, reply, req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, updatedReview, 'Review reply submitted successfully'));
  });
}

export default new ReviewController();
