import { jest } from '@jest/globals';
import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import { PayoutMethod, PaymentCard } from '../src/modules/paymentMethod/model.js';
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

describe('PaymentMethod Endpoints', () => {
  let travelerToken;
  let ownerToken;
  let mockTravelerUser;
  let mockOwnerUser;

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

    travelerToken = jwt.sign({ _id: mockTravelerUser._id, role: 'USER' }, process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_123!');
    ownerToken = jwt.sign({ _id: mockOwnerUser._id, role: 'HOTEL_OWNER' }, process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_123!');

    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const u = id.toString() === mockOwnerUser._id.toString() ? mockOwnerUser : mockTravelerUser;
      return {
        select: jest.fn().mockResolvedValue(u),
      };
    });

    jest.spyOn(PayoutMethod, 'updateMany').mockResolvedValue({ nModified: 0 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Payout Destinations (for Hosts)', () => {
    it('should add a payout method successfully', async () => {
      jest.spyOn(PayoutMethod, 'find').mockResolvedValue([]);
      const createSpy = jest.spyOn(PayoutMethod, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439018',
        owner: mockOwnerUser._id,
        type: 'Bank Transfer',
        name: 'Chase Checking',
        details: '•••• 4820',
        isDefault: true,
      });

      const res = await request(app)
        .post('/api/v1/payment-methods/payouts')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          type: 'Bank Transfer',
          name: 'Chase Checking',
          details: '•••• 4820',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Chase Checking');
      expect(createSpy).toHaveBeenCalled();
    });

    it('should list payout methods', async () => {
      const mockPayouts = [
        {
          _id: '507f1f77bcf86cd799439018',
          owner: mockOwnerUser._id,
          type: 'Bank Transfer',
          name: 'Chase Checking',
          details: '•••• 4820',
          isDefault: true,
        },
      ];

      jest.spyOn(PayoutMethod, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPayouts),
      });

      const res = await request(app)
        .get('/api/v1/payment-methods/payouts')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('should delete a payout method', async () => {
      const mockPayout = {
        _id: '507f1f77bcf86cd799439018',
        owner: mockOwnerUser._id,
        type: 'Bank Transfer',
        isDefault: true,
      };

      jest.spyOn(PayoutMethod, 'findOne').mockResolvedValue(mockPayout);
      jest.spyOn(PayoutMethod, 'deleteOne').mockResolvedValue({ deletedCount: 1 });
      jest.spyOn(PayoutMethod, 'findOne').mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .delete(`/api/v1/payment-methods/payouts/${mockPayout._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Payment Cards (for Travelers)', () => {
    it('should add a credit card successfully', async () => {
      const createSpy = jest.spyOn(PaymentCard, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439019',
        user: mockTravelerUser._id,
        cardholder: 'Julian Vance',
        number: '•••• •••• •••• 9012',
        expiry: '12/28',
        type: 'Visa',
        color: 'from-[#1e1b4b] to-[#312e81]',
      });

      const res = await request(app)
        .post('/api/v1/payment-methods/cards')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({
          cardholder: 'Julian Vance',
          number: '•••• •••• •••• 9012',
          expiry: '12/28',
          type: 'Visa',
          color: 'from-[#1e1b4b] to-[#312e81]',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cardholder).toBe('Julian Vance');
      expect(createSpy).toHaveBeenCalled();
    });

    it('should list cards', async () => {
      const mockCards = [
        {
          _id: '507f1f77bcf86cd799439019',
          cardholder: 'Julian Vance',
        },
      ];

      jest.spyOn(PaymentCard, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCards),
      });

      const res = await request(app)
        .get('/api/v1/payment-methods/cards')
        .set('Authorization', `Bearer ${travelerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('should delete a card', async () => {
      const mockCard = {
        _id: '507f1f77bcf86cd799439019',
        user: mockTravelerUser._id,
      };

      jest.spyOn(PaymentCard, 'findOne').mockResolvedValue(mockCard);
      jest.spyOn(PaymentCard, 'deleteOne').mockResolvedValue({ deletedCount: 1 });

      const res = await request(app)
        .delete(`/api/v1/payment-methods/cards/${mockCard._id}`)
        .set('Authorization', `Bearer ${travelerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
