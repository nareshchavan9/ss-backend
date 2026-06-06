import { jest } from '@jest/globals';
import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import Wishlist from '../src/modules/wishlist/model.js';
import Hotel from '../src/modules/hotel/model.js';
import User from '../src/modules/auth/model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { cacheService } from '../src/config/redis.js';

// Spy on redis client/cache methods
jest.spyOn(cacheService, 'getCache').mockResolvedValue(null);
jest.spyOn(cacheService, 'setCache').mockResolvedValue(true);
jest.spyOn(cacheService, 'deleteCache').mockResolvedValue(true);

// Spy on mongoose connect
jest.spyOn(mongoose, 'connect').mockResolvedValue({});

describe('Wishlist Endpoints', () => {
  let travelerToken;
  let mockTravelerUser;
  let mockHotel;

  beforeEach(() => {
    mockTravelerUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Traveler User',
      email: 'traveler@sanchara.com',
      role: 'USER',
    };

    mockHotel = {
      _id: '507f1f77bcf86cd799439013',
      name: 'Ocean View Resort',
      isActive: true,
    };

    travelerToken = jwt.sign(
      { _id: mockTravelerUser._id, role: 'USER' },
      process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_123!'
    );

    jest.spyOn(User, 'findById').mockImplementation(() => {
      return {
        select: jest.fn().mockResolvedValue(mockTravelerUser),
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/wishlist', () => {
    it('should add a hotel to wishlist if it is not already there', async () => {
      jest.spyOn(Wishlist, 'findOne').mockResolvedValue(null);
      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);
      
      const createSpy = jest.spyOn(Wishlist, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        user: mockTravelerUser._id,
        hotel: mockHotel._id,
      });

      const res = await request(app)
        .post('/api/v1/wishlist')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({ hotelId: mockHotel._id });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.toggled).toBe(true);
      expect(createSpy).toHaveBeenCalled();
    });

    it('should remove a hotel from wishlist if it is already there', async () => {
      const mockWishlistItem = {
        _id: '507f1f77bcf86cd799439099',
        user: mockTravelerUser._id,
        hotel: mockHotel._id,
      };

      jest.spyOn(Wishlist, 'findOne').mockResolvedValue(mockWishlistItem);
      const deleteSpy = jest.spyOn(Wishlist, 'deleteOne').mockResolvedValue({ deletedCount: 1 });

      const res = await request(app)
        .post('/api/v1/wishlist')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({ hotelId: mockHotel._id });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.toggled).toBe(false);
      expect(deleteSpy).toHaveBeenCalled();
    });

    it('should return 400 if hotelId is invalid format', async () => {
      const res = await request(app)
        .post('/api/v1/wishlist')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({ hotelId: 'invalid-id-123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/wishlist', () => {
    it('should list all wishlist items for logged in user', async () => {
      const mockWishlistItems = [
        {
          _id: '507f1f77bcf86cd799439099',
          user: mockTravelerUser._id,
          hotel: mockHotel,
        },
      ];

      jest.spyOn(Wishlist, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockWishlistItems),
        }),
      });

      const res = await request(app)
        .get('/api/v1/wishlist')
        .set('Authorization', `Bearer ${travelerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].hotel.name).toBe('Ocean View Resort');
    });
  });
});
