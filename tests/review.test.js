import { jest } from '@jest/globals';
import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import Review from '../src/modules/review/model.js';
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

describe('Review Endpoints', () => {
  let travelerToken;
  let ownerToken;
  let mockTravelerUser;
  let mockOwnerUser;
  let mockHotel;

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
      totalReviews: 0,
      averageRating: 0,
      save: jest.fn().mockResolvedValue(true),
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

  describe('POST /api/v1/reviews', () => {
    it('should create a review successfully and update hotel ratings', async () => {
      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);

      const mockReview = {
        _id: '507f1f77bcf86cd799439017',
        hotel: mockHotel._id,
        user: mockTravelerUser._id,
        rating: 5,
        comment: 'Beautiful resort!',
      };

      const createSpy = jest.spyOn(Review, 'create').mockResolvedValue(mockReview);
      
      // Mock finding reviews for stat calculations
      jest.spyOn(Review, 'find').mockResolvedValue([mockReview]);

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({
          hotel: mockHotel._id,
          rating: 5,
          comment: 'Beautiful resort!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment).toBe('Beautiful resort!');
      expect(createSpy).toHaveBeenCalled();
      expect(mockHotel.save).toHaveBeenCalled();
      expect(mockHotel.averageRating).toBe(5);
      expect(mockHotel.totalReviews).toBe(1);
    });

    it('should fail if rating is outside 1-5 range', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({
          hotel: mockHotel._id,
          rating: 6, // Invalid
          comment: 'Too good to be true',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/reviews/:id/reply', () => {
    it('should allow hotel owner to reply to review', async () => {
      const mockReview = {
        _id: '507f1f77bcf86cd799439017',
        hotel: mockHotel._id,
        rating: 5,
        comment: 'Beautiful resort!',
        reply: '',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Review, 'findById').mockResolvedValue(mockReview);
      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);

      const res = await request(app)
        .patch(`/api/v1/reviews/${mockReview._id}/reply`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ reply: 'Thank you for staying with us!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockReview.reply).toBe('Thank you for staying with us!');
      expect(mockReview.save).toHaveBeenCalled();
    });

    it('should block non-owners from replying', async () => {
      const mockReview = {
        _id: '507f1f77bcf86cd799439017',
        hotel: mockHotel._id,
        rating: 5,
        comment: 'Beautiful resort!',
        reply: '',
      };

      jest.spyOn(Review, 'findById').mockResolvedValue(mockReview);
      jest.spyOn(Hotel, 'findById').mockResolvedValue(mockHotel);

      const res = await request(app)
        .patch(`/api/v1/reviews/${mockReview._id}/reply`)
        .set('Authorization', `Bearer ${travelerToken}`) // Traveler, not host
        .send({ reply: 'Spam reply' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
