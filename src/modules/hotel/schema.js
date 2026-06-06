import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string({ required_error: 'City is required' }).trim().min(1, 'City cannot be empty'),
  state: z.string().optional(),
  country: z.string({ required_error: 'Country is required' }).trim().min(1, 'Country cannot be empty'),
  pincode: z.string().optional(),
});

const locationSchema = z.object({
  coordinates: z.array(z.number()).length(2, 'Coordinates must be exactly [longitude, latitude]'),
});

const policiesSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  cancellation: z.string().optional(),
});

export const createHotelSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Hotel name is required' }).trim().min(1, 'Hotel name cannot be empty'),
    description: z.string().optional(),
    address: addressSchema,
    location: locationSchema,
    starRating: z.number({ required_error: 'Star rating is required' }).min(1).max(5),
    amenities: z.array(z.string()).optional(),
    contactEmail: z.string().email('Invalid contact email').optional().or(z.literal('')),
    contactPhone: z.string().optional(),
    policies: policiesSchema.optional(),
  }),
});

export const updateHotelSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    address: addressSchema.partial().optional(),
    location: locationSchema.optional(),
    starRating: z.number().min(1).max(5).optional(),
    amenities: z.array(z.string()).optional(),
    contactEmail: z.string().email('Invalid contact email').optional().or(z.literal('')),
    contactPhone: z.string().optional(),
    policies: policiesSchema.optional(),
  }).partial(),
});

export const searchHotelQuerySchema = z.object({
  query: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
    starRating: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(5)).optional(),
    minRating: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0).max(5)).optional(),
    amenities: z.string().optional(), // Will handle comma split in service
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.enum(['price', 'rating', 'newest']).optional(),
    lat: z.string().transform(val => parseFloat(val)).optional(),
    lng: z.string().transform(val => parseFloat(val)).optional(),
    radius: z.string().transform(val => parseFloat(val)).optional(), // in km
  }),
});
