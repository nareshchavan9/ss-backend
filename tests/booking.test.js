import { jest } from '@jest/globals';
import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import Booking from '../src/modules/booking/model.js';
import Hotel from '../src/modules/hotel/model.js';
import Room from '../src/modules/room/model.js';
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

describe('Booking Endpoints', () => {
  let travelerToken;
  let ownerToken;
  let mockTravelerUser;
  let mockOwnerUser;
  let mockHotel;
  let mockRoom;

  beforeEach(() => {
    mockTravelerUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Traveler User',
      email: 'traveler@sanchara.com',
      role: 'USER',
    };

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

    mockRoom = {
      _id: '507f1f77bcf86cd799439014',
      hotel: mockHotel._id,
      roomNumber: '101A',
      type: 'Deluxe',
      pricePerNight: 120,
      isAvailable: true,
      isDeleted: false,
    };

    travelerToken = jwt.sign({ _id: mockTravelerUser._id, role: 'USER' }, process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_123!');
    ownerToken = jwt.sign({ _id: mockOwnerUser._id, role: 'HOTEL_OWNER' }, process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_123!');

    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const u = id.toString() === mockOwnerUser._id.toString() ? mockOwnerUser : mockTravelerUser;
      return {
        select: jest.fn().mockResolvedValue(u),
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/bookings', () => {
    it('should create a booking successfully if inputs are valid', async () => {
      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);
      jest.spyOn(Room, 'findOne').mockResolvedValue(mockRoom);

      const mockBookingData = {
        hotel: mockHotel._id,
        room: mockRoom._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@gmail.com',
        checkIn: '2026-06-10',
        checkOut: '2026-06-15',
        guests: '2 Adults',
        nights: 5,
        subtotal: 600,
        serviceFee: 36,
        total: 636,
        requests: 'high floor',
      };

      const createSpy = jest.spyOn(Booking, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439015',
        ...mockBookingData,
        user: mockTravelerUser._id,
        status: 'Pending',
        payoutStatus: 'Pending Approval',
      });

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send(mockBookingData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('John');
      expect(createSpy).toHaveBeenCalled();
    });

    it('should fail validation if email is invalid', async () => {
      const mockBookingData = {
        hotel: mockHotel._id,
        room: mockRoom._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        checkIn: '2026-06-10',
        checkOut: '2026-06-15',
        guests: '2 Adults',
        nights: 5,
        subtotal: 600,
        serviceFee: 36,
        total: 636,
      };

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send(mockBookingData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation Error');
    });
  });

  describe('GET /api/v1/bookings/host', () => {
    it('should retrieve host reservations', async () => {
      jest.spyOn(Hotel, 'find').mockResolvedValue([mockHotel]);

      const mockBookings = [
        {
          _id: '507f1f77bcf86cd799439015',
          hotel: mockHotel._id,
          room: mockRoom._id,
          firstName: 'John',
          lastName: 'Doe',
          total: 636,
          status: 'Pending',
        },
      ];

      jest.spyOn(Booking, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockBookings),
            }),
          }),
        }),
      });

      const res = await request(app)
        .get('/api/v1/bookings/host')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].firstName).toBe('John');
    });
  });

  describe('PATCH /api/v1/bookings/:id/status', () => {
    it('should allow host to update reservation status', async () => {
      const mockBooking = {
        _id: '507f1f77bcf86cd799439015',
        hotel: mockHotel._id,
        user: mockTravelerUser._id,
        status: 'Pending',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Booking, 'findById').mockResolvedValue(mockBooking);
      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);

      const res = await request(app)
        .patch(`/api/v1/bookings/${mockBooking._id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'Confirmed' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockBooking.status).toBe('Confirmed');
      expect(mockBooking.payoutStatus).toBe('Settled');
    });

    it('should allow traveler to cancel their own booking', async () => {
      const mockBooking = {
        _id: '507f1f77bcf86cd799439015',
        hotel: mockHotel._id,
        user: mockTravelerUser._id,
        status: 'Pending',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Booking, 'findById').mockResolvedValue(mockBooking);
      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);

      const res = await request(app)
        .patch(`/api/v1/bookings/${mockBooking._id}/status`)
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({ status: 'Cancelled' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockBooking.status).toBe('Cancelled');
    });

    it('should not allow traveler to update status to Confirmed', async () => {
      const mockBooking = {
        _id: '507f1f77bcf86cd799439015',
        hotel: mockHotel._id,
        user: mockTravelerUser._id,
        status: 'Pending',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Booking, 'findById').mockResolvedValue(mockBooking);
      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);

      const res = await request(app)
        .patch(`/api/v1/bookings/${mockBooking._id}/status`)
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({ status: 'Confirmed' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
