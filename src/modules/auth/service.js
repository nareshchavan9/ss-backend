import User from './model.js';
import Broadcast from './broadcastModel.js';
import SystemConfig from './systemConfigModel.js';
import ApiError from '../../utils/ApiError.js';
import { uploadToCloudinary } from '../../config/cloudinary.js';

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData 
   * @returns {Promise<Object>} The registered user profile
   */
  async registerUser({ name, email, password, role }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    const createdUser = await User.findById(user._id).select('-password -refreshToken');
    if (!createdUser) {
      throw new ApiError(500, 'Something went wrong while registering the user');
    }

    return createdUser;
  }

  /**
   * Log in user
   * @param {Object} credentials 
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
   */
  async loginUser({ email, password }) {
    // We must explicitly select password since select: false is set in schema
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(400, 'Invalid email or password');
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(400, 'Invalid email or password');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    return {
      user: loggedInUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Log out user by clearing the refreshToken in DB
   * @param {string} userId 
   */
  async logoutUser(userId) {
    await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          refreshToken: 1, // Remove the field
        },
      },
      { new: true }
    );
  }

  /**
   * Refresh the access and refresh tokens
   * @param {string} incomingRefreshToken 
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async refreshAccessToken(incomingRefreshToken) {
    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.JWT_REFRESH_SECRET
      );

      const user = await User.findById(decodedToken._id).select('+refreshToken');
      if (!user) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, 'Refresh token is expired or used');
      }

      const accessToken = user.generateAccessToken();
      const newRefreshToken = user.generateRefreshToken();

      user.refreshToken = newRefreshToken;
      await user.save({ validateBeforeSave: false });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new ApiError(401, error?.message || 'Invalid refresh token');
    }
  }

  /**
   * Get all registered users (admin only)
   * @returns {Promise<Array>} List of user objects
   */
  async getAllUsers() {
    return await User.find().select('-password -refreshToken');
  }

  /**
   * Update a user's role (admin only)
   * @param {string} userId
   * @param {string} role
   * @returns {Promise<Object>} Updated user profile
   */
  async updateUserRole(userId, role) {
    if (!['ADMIN', 'HOTEL_OWNER', 'USER'].includes(role)) {
      throw new ApiError(400, 'Invalid role');
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  /**
   * Update a user's status (verification or suspension, admin only)
   * @param {string} userId
   * @param {Object} statusData
   * @returns {Promise<Object>} Updated user profile
   */
  async updateUserStatus(userId, { isVerified, isSuspended }) {
    const updateData = {};
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (isSuspended !== undefined) updateData.isSuspended = isSuspended;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  /**
   * Create a new broadcast message
   * @param {Object} broadcastData
   * @returns {Promise<Object>} Created broadcast
   */
  async createBroadcast({ message, targetAudience, createdBy }) {
    if (!message || !message.trim()) {
      throw new ApiError(400, 'Message text is required');
    }
    const broadcast = await Broadcast.create({
      message,
      targetAudience,
      createdBy,
    });
    return broadcast;
  }

  /**
   * Get active broadcasts matching the user's role
   * @param {string} role
   * @returns {Promise<Array>} List of broadcasts
   */
  async getBroadcastsForRole(role) {
    if (role === 'ADMIN') {
      return await Broadcast.find().sort({ createdAt: -1 });
    }
    return await Broadcast.find({
      targetAudience: { $in: ['EVERYONE', role] },
    }).sort({ createdAt: -1 });
  }

  /**
   * Update user profile fields (name, email, phone)
   * @param {string} userId
   * @param {Object} profileData
   * @returns {Promise<Object>} Updated user profile
   */
  async updateProfile(userId, { name, email, phone }) {
    if (!name || !name.trim()) {
      throw new ApiError(400, 'Name is required');
    }
    if (!email || !email.trim()) {
      throw new ApiError(400, 'Email is required');
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, phone },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  /**
   * Upload user avatar to Cloudinary and update profile
   * @param {string} userId
   * @param {Buffer} fileBuffer
   * @returns {Promise<Object>} Updated user profile
   */
  async updateAvatar(userId, fileBuffer) {
    const uploadResult = await uploadToCloudinary(fileBuffer, 'avatars');
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: uploadResult.url },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  /**
   * Get system configuration document
   * @returns {Promise<Object>} System configuration
   */
  async getSystemConfig() {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    return config;
  }

  /**
   * Update system configuration fields
   * @param {Object} configData
   * @returns {Promise<Object>} Updated system configuration
   */
  async updateSystemConfig(configData) {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create(configData);
    } else {
      config = await SystemConfig.findByIdAndUpdate(
        config._id,
        configData,
        { new: true }
      );
    }
    return config;
  }

  /**
   * Update a broadcast message (admin only)
   * @param {string} broadcastId
   * @param {Object} broadcastData
   * @returns {Promise<Object>} Updated broadcast
   */
  async updateBroadcast(broadcastId, { message, targetAudience }) {
    if (!message || !message.trim()) {
      throw new ApiError(400, 'Message text is required');
    }
    const broadcast = await Broadcast.findByIdAndUpdate(
      broadcastId,
      { message, targetAudience },
      { new: true }
    );
    if (!broadcast) {
      throw new ApiError(404, 'Broadcast not found');
    }
    return broadcast;
  }

  /**
   * Delete a broadcast message (admin only)
   * @param {string} broadcastId
   * @returns {Promise<Object>} Deleted broadcast
   */
  async deleteBroadcast(broadcastId) {
    const broadcast = await Broadcast.findByIdAndDelete(broadcastId);
    if (!broadcast) {
      throw new ApiError(404, 'Broadcast not found');
    }
    return broadcast;
  }
}

// We import jwt here as it's needed for jwt.verify in refreshAccessToken
import jwt from 'jsonwebtoken';

export default new AuthService();
