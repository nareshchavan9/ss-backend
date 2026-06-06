import RoomService from './service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary.js';

class RoomController {
  create = asyncHandler(async (req, res) => {
    const { hotelId } = req.params;
    const room = await RoomService.addRoom(hotelId, req.body, req.user._id, req.user.role);
    return res
      .status(201)
      .json(new ApiResponse(201, room, 'Room added successfully'));
  });

  list = asyncHandler(async (req, res) => {
    const { hotelId } = req.params;
    const rooms = await RoomService.getRoomsByHotel(hotelId);
    return res
      .status(200)
      .json(new ApiResponse(200, rooms, 'Rooms retrieved successfully'));
  });

  getDetail = asyncHandler(async (req, res) => {
    const { hotelId, roomId } = req.params;
    const room = await RoomService.getRoomDetail(hotelId, roomId);
    return res
      .status(200)
      .json(new ApiResponse(200, room, 'Room details retrieved successfully'));
  });

  update = asyncHandler(async (req, res) => {
    const { hotelId, roomId } = req.params;
    const room = await RoomService.updateRoom(hotelId, roomId, req.body, req.user._id, req.user.role);
    return res
      .status(200)
      .json(new ApiResponse(200, room, 'Room updated successfully'));
  });

  delete = asyncHandler(async (req, res) => {
    const { hotelId, roomId } = req.params;
    const room = await RoomService.deleteRoom(hotelId, roomId, req.user.role);
    return res
      .status(200)
      .json(new ApiResponse(200, room, 'Room soft-deleted successfully'));
  });

  uploadImages = asyncHandler(async (req, res) => {
    const { hotelId, roomId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      throw new ApiError(400, 'No images uploaded. Please upload at least one image.');
    }

    const uploadedImages = [];
    try {
      for (const file of files) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'sanchara_setu/rooms');
        uploadedImages.push(uploadResult);
      }
    } catch (error) {
      throw new ApiError(500, `Failed to upload room images to Cloudinary: ${error.message}`);
    }

    let updatedRoom = null;
    try {
      for (const img of uploadedImages) {
        updatedRoom = await RoomService.addImage(hotelId, roomId, img, req.user._id, req.user.role);
      }
    } catch (error) {
      // Clean up uploaded assets on DB failure
      for (const img of uploadedImages) {
        await deleteFromCloudinary(img.public_id).catch(() => {});
      }
      throw error;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedRoom, 'Room images uploaded successfully'));
  });

  checkAvailability = asyncHandler(async (req, res) => {
    const filters = req.query;
    const availableRooms = await RoomService.checkAvailability(filters);
    return res
      .status(200)
      .json(new ApiResponse(200, availableRooms, 'Available rooms retrieved successfully'));
  });
}

export default new RoomController();
