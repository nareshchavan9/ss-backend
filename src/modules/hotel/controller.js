import HotelService from './service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { uploadToCloudinary } from '../../config/cloudinary.js';

class HotelController {
  create = asyncHandler(async (req, res) => {
    const hotel = await HotelService.createHotel(req.body, req.user._id);
    return res
      .status(201)
      .json(new ApiResponse(201, hotel, 'Hotel created successfully'));
  });

  list = asyncHandler(async (req, res) => {
    const filters = req.query;
    const result = await HotelService.searchHotels(filters);
    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Hotels retrieved successfully'));
  });

  getDetail = asyncHandler(async (req, res) => {
    const hotel = await HotelService.getHotelById(req.params.id);
    return res
      .status(200)
      .json(new ApiResponse(200, hotel, 'Hotel details retrieved successfully'));
  });

  update = asyncHandler(async (req, res) => {
    const updatedHotel = await HotelService.updateHotel(
      req.params.id,
      req.body,
      req.user._id,
      req.user.role
    );
    return res
      .status(200)
      .json(new ApiResponse(200, updatedHotel, 'Hotel updated successfully'));
  });

  delete = asyncHandler(async (req, res) => {
    const deletedHotel = await HotelService.deleteHotel(req.params.id, req.user.role);
    return res
      .status(200)
      .json(new ApiResponse(200, deletedHotel, 'Hotel soft-deleted successfully'));
  });

  uploadImages = asyncHandler(async (req, res) => {
    const hotelId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
      throw new ApiError(400, 'No images uploaded. Please upload at least one image.');
    }

    // Process and upload all images to Cloudinary
    const uploadedImages = [];
    try {
      for (const file of files) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'sanchara_setu/hotels');
        uploadedImages.push(uploadResult);
      }
    } catch (error) {
      throw new ApiError(500, `Failed to upload images to Cloudinary: ${error.message}`);
    }

    // Add images to Hotel model database record
    let updatedHotel = null;
    try {
      for (const img of uploadedImages) {
        updatedHotel = await HotelService.addImage(hotelId, img, req.user._id, req.user.role);
      }
    } catch (error) {
      // Cleanup uploaded images on DB failure
      for (const img of uploadedImages) {
        await deleteFromCloudinary(img.public_id).catch(() => {});
      }
      throw error;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedHotel, 'Images uploaded successfully'));
  });

  deleteImage = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;
    const updatedHotel = await HotelService.removeImage(id, imageId, req.user._id, req.user.role);

    return res
      .status(200)
      .json(new ApiResponse(200, updatedHotel, 'Image removed successfully'));
  });
}

import { deleteFromCloudinary } from '../../config/cloudinary.js';

export default new HotelController();
