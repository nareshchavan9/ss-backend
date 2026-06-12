  import AuthService from './service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

// Cookie options helper
const getCookieOptions = (maxAgeInMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none', // Suitable for cross-site cookie transfers if needed
  maxAge: maxAgeInMs,
});

class AuthController {
  register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const registeredUser = await AuthService.registerUser({ name, email, password, role });
    
    return res
      .status(201)
      .json(new ApiResponse(201, registeredUser, 'User registered successfully'));
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.loginUser({ email, password });

    // Store tokens in cookies
    // Access token (15 minutes), Refresh token (7 days)
    const accessCookieMaxAge = 15 * 60 * 1000;
    const refreshCookieMaxAge = 7 * 24 * 60 * 60 * 1000;

    return res
      .status(200)
      .cookie('accessToken', accessToken, getCookieOptions(accessCookieMaxAge))
      .cookie('refreshToken', refreshToken, getCookieOptions(refreshCookieMaxAge))
      .json(new ApiResponse(200, { user, accessToken }, 'User logged in successfully'));
  });

  logout = asyncHandler(async (req, res) => {
    await AuthService.logoutUser(req.user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };

    return res
      .status(200)
      .clearCookie('accessToken', options)
      .clearCookie('refreshToken', options)
      .json(new ApiResponse(200, {}, 'User logged out successfully'));
  });

  refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, 'Unauthorized request. Refresh token is missing.');
    }

    const { accessToken, refreshToken } = await AuthService.refreshAccessToken(incomingRefreshToken);

    const accessCookieMaxAge = 15 * 60 * 1000;
    const refreshCookieMaxAge = 7 * 24 * 60 * 60 * 1000;

    return res
      .status(200)
      .cookie('accessToken', accessToken, getCookieOptions(accessCookieMaxAge))
      .cookie('refreshToken', refreshToken, getCookieOptions(refreshCookieMaxAge))
      .json(new ApiResponse(200, { accessToken }, 'Access token refreshed successfully'));
  });

  getMe = asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, 'User profile retrieved successfully'));
  });

  getAllUsers = asyncHandler(async (req, res) => {
    const users = await AuthService.getAllUsers();
    return res
      .status(200)
      .json(new ApiResponse(200, users, 'Users retrieved successfully'));
  });

  createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const registeredUser = await AuthService.registerUser({ name, email, password, role });
    return res
      .status(201)
      .json(new ApiResponse(201, registeredUser, 'User created successfully'));
  });

  updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const updatedUser = await AuthService.updateUserRole(id, role);
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, 'User role updated successfully'));
  });

  updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isVerified, isSuspended } = req.body;
    const updatedUser = await AuthService.updateUserStatus(id, { isVerified, isSuspended });
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, 'User status updated successfully'));
  });

  createBroadcast = asyncHandler(async (req, res) => {
    const { message, targetAudience } = req.body;
    const broadcast = await AuthService.createBroadcast({
      message,
      targetAudience,
      createdBy: req.user._id,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, broadcast, 'Broadcast alert created successfully'));
  });

  getBroadcasts = asyncHandler(async (req, res) => {
    const broadcasts = await AuthService.getBroadcastsForRole(req.user.role);
    return res
      .status(200)
      .json(new ApiResponse(200, broadcasts, 'Active broadcasts retrieved successfully'));
  });

  updateBroadcast = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, targetAudience } = req.body;
    const updatedBroadcast = await AuthService.updateBroadcast(id, { message, targetAudience });
    return res
      .status(200)
      .json(new ApiResponse(200, updatedBroadcast, 'Broadcast alert updated successfully'));
  });

  deleteBroadcast = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await AuthService.deleteBroadcast(id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Broadcast alert deleted successfully'));
  });

  updateProfile = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;
    const updatedUser = await AuthService.updateProfile(req.user._id, { name, email, phone });
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, 'User profile updated successfully'));
  });

  updateAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, 'Please upload a photo file');
    }
    const updatedUser = await AuthService.updateAvatar(req.user._id, req.file.buffer);
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, 'User avatar updated successfully'));
  });

  removeAvatar = asyncHandler(async (req, res) => {
    const updatedUser = await AuthService.removeAvatar(req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, 'User avatar removed successfully'));
  });

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user._id, { currentPassword, newPassword });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Password changed successfully'));
  });


  getSystemConfig = asyncHandler(async (req, res) => {
    const config = await AuthService.getSystemConfig();
    return res
      .status(200)
      .json(new ApiResponse(200, config, 'System configuration retrieved successfully'));
  });

  updateSystemConfig = asyncHandler(async (req, res) => {
    const { prefBackup, prefDebugLog, prefAutoCache } = req.body;
    const config = await AuthService.updateSystemConfig({ prefBackup, prefDebugLog, prefAutoCache });
    return res
      .status(200)
      .json(new ApiResponse(200, config, 'System configuration updated successfully'));
  });
}

export default new AuthController();
