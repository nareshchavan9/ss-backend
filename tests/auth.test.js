import { jest } from '@jest/globals';
import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/modules/auth/model.js';
import mongoose from 'mongoose';
import { cacheService } from '../src/config/redis.js';
import jwt from 'jsonwebtoken';
import SystemConfig from '../src/modules/auth/systemConfigModel.js';

// Spy on redis client/cache methods
jest.spyOn(cacheService, 'getCache').mockResolvedValue(null);
jest.spyOn(cacheService, 'setCache').mockResolvedValue(true);
jest.spyOn(cacheService, 'deleteCache').mockResolvedValue(true);

// Spy on mongoose connect
jest.spyOn(mongoose, 'connect').mockResolvedValue({});

describe('Auth Endpoints', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(null);
      
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        isVerified: false,
      };
      
      const createSpy = jest.spyOn(User, 'create').mockResolvedValue(mockUser);
      
      const findByIdSpy = jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('john@example.com');
      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it('should fail registration if email is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation Error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUserInstance = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        isPasswordCorrect: jest.fn().mockResolvedValue(true),
        generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
        generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
        save: jest.fn().mockResolvedValue(true),
      };

      const findOneSpy = jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserInstance),
      });

      const findByIdSpy = jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: mockUserInstance._id,
          name: mockUserInstance.name,
          email: mockUserInstance.email,
          role: mockUserInstance.role,
        }),
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('mock-access-token');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should fail login with incorrect password', async () => {
      const mockUserInstance = {
        isPasswordCorrect: jest.fn().mockResolvedValue(false),
      };

      const findOneSpy = jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserInstance),
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('Admin Endpoints', () => {
    let jwtVerifySpy;

    beforeEach(() => {
      jwtVerifySpy = jest.spyOn(jwt, 'verify');
    });

    it('should return all users for ADMIN role', async () => {
      const mockAdminUser = {
        _id: 'admin-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      const mockUsers = [
        { _id: 'user-1', name: 'User One', email: 'user1@example.com', role: 'USER' },
        { _id: 'user-2', name: 'User Two', email: 'user2@example.com', role: 'USER' },
      ];

      jwtVerifySpy.mockReturnValue({ _id: 'admin-id' });
      const findByIdSpy = jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdminUser),
      });

      const findSpy = jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });

      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(findSpy).toHaveBeenCalledTimes(1);
    });

    it('should deny access to non-admin users', async () => {
      const mockNormalUser = {
        _id: 'user-id',
        name: 'Normal User',
        email: 'user@example.com',
        role: 'USER',
      };

      jwtVerifySpy.mockReturnValue({ _id: 'user-id' });
      const findByIdSpy = jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockNormalUser),
      });

      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', 'Bearer user-token');

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('Profile & System Config Endpoints', () => {
    let jwtVerifySpy;

    beforeEach(() => {
      jwtVerifySpy = jest.spyOn(jwt, 'verify');
    });

    describe('PUT /api/v1/auth/profile', () => {
      it('should update profile successfully', async () => {
        const mockUser = {
          _id: 'user-id',
          name: 'Old Name',
          email: 'old@example.com',
          phone: '111',
          role: 'USER'
        };

        const updatedMockUser = {
          _id: 'user-id',
          name: 'New Name',
          email: 'new@example.com',
          phone: '222',
          role: 'USER'
        };

        jwtVerifySpy.mockReturnValue({ _id: 'user-id' });
        jest.spyOn(User, 'findById').mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser)
        });
        jest.spyOn(User, 'findOne').mockResolvedValue(null);
        jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
          select: jest.fn().mockResolvedValue(updatedMockUser)
        });

        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', 'Bearer user-token')
          .send({
            name: 'New Name',
            email: 'new@example.com',
            phone: '222'
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('New Name');
        expect(res.body.data.phone).toBe('222');
      });
    });

    describe('System Config Endpoints', () => {
      it('should retrieve system config for Admin', async () => {
        const mockAdmin = {
          _id: 'admin-id',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN'
        };

        const mockConfig = {
          prefBackup: true,
          prefDebugLog: false,
          prefAutoCache: true
        };

        jwtVerifySpy.mockReturnValue({ _id: 'admin-id' });
        jest.spyOn(User, 'findById').mockReturnValue({
          select: jest.fn().mockResolvedValue(mockAdmin)
        });
        jest.spyOn(SystemConfig, 'findOne').mockResolvedValue(mockConfig);

        const res = await request(app)
          .get('/api/v1/auth/system-config')
          .set('Authorization', 'Bearer admin-token');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.prefBackup).toBe(true);
      });

      it('should update system config for Admin', async () => {
        const mockAdmin = {
          _id: 'admin-id',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN'
        };

        const updatedConfig = {
          prefBackup: false,
          prefDebugLog: true,
          prefAutoCache: false
        };

        jwtVerifySpy.mockReturnValue({ _id: 'admin-id' });
        jest.spyOn(User, 'findById').mockReturnValue({
          select: jest.fn().mockResolvedValue(mockAdmin)
        });
        jest.spyOn(SystemConfig, 'findOne').mockResolvedValue({ _id: 'config-id' });
        jest.spyOn(SystemConfig, 'findByIdAndUpdate').mockResolvedValue(updatedConfig);

        const res = await request(app)
          .put('/api/v1/auth/system-config')
          .set('Authorization', 'Bearer admin-token')
          .send({
            prefBackup: false,
            prefDebugLog: true,
            prefAutoCache: false
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.prefBackup).toBe(false);
        expect(res.body.data.prefDebugLog).toBe(true);
      });
    });
  });
});
