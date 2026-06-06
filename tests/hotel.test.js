import { jest } from '@jest/globals';
import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
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

describe('Hotel Endpoints', () => {
  let adminToken;
  let ownerToken;
  let mockAdminUser;
  let mockOwnerUser;

  beforeEach(() => {
    mockAdminUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Admin User',
      email: 'admin@sanchara.com',
      role: 'ADMIN',
    };

    mockOwnerUser = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Owner User',
      email: 'owner@sanchara.com',
      role: 'HOTEL_OWNER',
    };

    adminToken = jwt.sign({ _id: mockAdminUser._id, role: 'ADMIN' }, process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_123!');
    ownerToken = jwt.sign({ _id: mockOwnerUser._id, role: 'HOTEL_OWNER' }, process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_123!');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/hotels', () => {
    it('should list hotels successfully', async () => {
      const mockHotelsList = [
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Grand Hyatt',
          starRating: 5,
          address: { city: 'Mumbai', country: 'India' },
          location: { type: 'Point', coordinates: [72.8777, 19.076] },
          isActive: true,
        },
      ];

      const findSpy = jest.spyOn(Hotel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockHotelsList),
      });

      const countSpy = jest.spyOn(Hotel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app).get('/api/v1/hotels?city=Mumbai');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hotels).toHaveLength(1);
      expect(res.body.data.hotels[0].name).toBe('Grand Hyatt');
    });
  });

  describe('POST /api/v1/hotels', () => {
    it('should create a hotel if user is HOTEL_OWNER', async () => {
      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockOwnerUser),
      });

      const mockHotelData = {
        name: 'Ocean View Resort',
        address: { city: 'Goa', country: 'India' },
        location: { coordinates: [73.818, 15.49] },
        starRating: 4,
      };

      const createSpy = jest.spyOn(Hotel, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        ...mockHotelData,
        owner: mockOwnerUser._id,
        isActive: true,
      });

      const res = await request(app)
        .post('/api/v1/hotels')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(mockHotelData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Ocean View Resort');
    });

    it('should fail to create a hotel if user is standard USER role', async () => {
      const standardUser = { _id: '507f1f77bcf86cd799439015', role: 'USER' };
      const userToken = jwt.sign({ _id: standardUser._id, role: 'USER' }, process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_123!');

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(standardUser),
      });

      const res = await request(app)
        .post('/api/v1/hotels')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Invalid Access Hotel',
          address: { city: 'Goa', country: 'India' },
          location: { coordinates: [73.818, 15.49] },
          starRating: 4,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('DELETE /api/v1/hotels/:id', () => {
    it('should soft delete hotel if user is ADMIN', async () => {
      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdminUser),
      });

      const mockHotel = {
        _id: '507f1f77bcf86cd799439013',
        name: 'Grand Hyatt',
        owner: '507f1f77bcf86cd799439012',
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);

      const res = await request(app)
        .delete('/api/v1/hotels/507f1f77bcf86cd799439013')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockHotel.isActive).toBe(false);
    });
  });
});
