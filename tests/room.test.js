import { jest } from '@jest/globals';
import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import Room from '../src/modules/room/model.js';
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

describe('Room Endpoints', () => {
  let ownerToken;
  let mockOwnerUser;
  let mockHotel;

  beforeEach(() => {
    mockOwnerUser = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Owner User',
      email: 'owner@sanchara.com',
      role: 'HOTEL_OWNER',
    };

    mockHotel = {
      _id: '507f1f77bcf86cd799439013',
      name: 'Ocean View Resort',
      owner: mockOwnerUser._id,
      isActive: true,
    };

    ownerToken = jwt.sign({ _id: mockOwnerUser._id, role: 'HOTEL_OWNER' }, process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_123!');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/hotels/:hotelId/rooms', () => {
    it('should add a room successfully if authorized', async () => {
      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockOwnerUser),
      });

      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);

      const mockRoomData = {
        roomNumber: '101A',
        type: 'Single',
        pricePerNight: 120,
        discountedPrice: 100,
        capacity: { adults: 1, children: 0 },
        bedType: 'Single',
      };

      const createSpy = jest.spyOn(Room, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439016',
        ...mockRoomData,
        hotel: mockHotel._id,
        isAvailable: true,
        isDeleted: false,
      });

      const res = await request(app)
        .post(`/api/v1/hotels/${mockHotel._id}/rooms`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(mockRoomData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roomNumber).toBe('101A');
    });

    it('should fail if discountedPrice is greater than or equal to pricePerNight', async () => {
      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockOwnerUser),
      });

      const mockRoomData = {
        roomNumber: '101A',
        type: 'Single',
        pricePerNight: 100,
        discountedPrice: 120, // Invalid: exceeds base price
        capacity: { adults: 1, children: 0 },
        bedType: 'Single',
      };

      const res = await request(app)
        .post(`/api/v1/hotels/${mockHotel._id}/rooms`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(mockRoomData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation Error');
      expect(res.body.errors[0].message).toContain('Discounted price must be less than the price per night');
    });
  });

  describe('GET /api/v1/rooms/available', () => {
    it('should query available rooms successfully', async () => {
      const mockAvailableRooms = [
        {
          _id: '507f1f77bcf86cd799439016',
          roomNumber: '101A',
          type: 'Single',
          pricePerNight: 120,
          isAvailable: true,
          isDeleted: false,
        },
      ];

      const findSpy = jest.spyOn(Room, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAvailableRooms),
      });

      const res = await request(app).get('/api/v1/rooms/available?type=Single&adults=1');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].roomNumber).toBe('101A');
    });
  });
});
