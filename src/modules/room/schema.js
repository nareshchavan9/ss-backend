import { z } from 'zod';

const capacitySchema = z.object({
  adults: z.number({ required_error: 'Adult capacity is required' }).min(1),
  children: z.number().min(0).default(0),
});

export const createRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string({ required_error: 'Room number is required' }).trim().min(1, 'Room number cannot be empty'),
    type: z.enum(['Single', 'Double', 'Suite', 'Deluxe', 'Family'], {
      required_error: 'Room type is required',
    }),
    description: z.string().optional(),
    pricePerNight: z.number({ required_error: 'Price per night is required' }).min(0),
    discountedPrice: z.number().min(0).optional(),
    capacity: capacitySchema,
    bedType: z.enum(['Single', 'Double', 'Twin', 'King', 'Queen'], {
      required_error: 'Bed type is required',
    }),
    size: z.number().min(0).optional(),
    floor: z.number().optional(),
    amenities: z.array(z.string()).optional(),
    maxBookings: z.number().min(1).optional(),
  }).refine(
    (data) => {
      if (data.discountedPrice !== undefined && data.discountedPrice !== null) {
        return data.discountedPrice < data.pricePerNight;
      }
      return true;
    },
    {
      message: 'Discounted price must be less than the price per night',
      path: ['discountedPrice'],
    }
  ),
});

export const updateRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().trim().min(1).optional(),
    type: z.enum(['Single', 'Double', 'Suite', 'Deluxe', 'Family']).optional(),
    description: z.string().optional(),
    pricePerNight: z.number().min(0).optional(),
    discountedPrice: z.number().min(0).optional(),
    capacity: capacitySchema.partial().optional(),
    bedType: z.enum(['Single', 'Double', 'Twin', 'King', 'Queen']).optional(),
    size: z.number().min(0).optional(),
    floor: z.number().optional(),
    amenities: z.array(z.string()).optional(),
    maxBookings: z.number().min(1).optional(),
  }).refine(
    (data) => {
      // Check validation if both price fields are present or modified
      if (data.discountedPrice !== undefined && data.pricePerNight !== undefined) {
        return data.discountedPrice < data.pricePerNight;
      }
      return true;
    },
    {
      message: 'Discounted price must be less than the price per night',
      path: ['discountedPrice'],
    }
  ),
});

export const checkAvailabilityQuerySchema = z.object({
  query: z.object({
    hotelId: z.string().optional(),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be in YYYY-MM-DD format').optional(),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be in YYYY-MM-DD format').optional(),
    adults: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional(),
    children: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(0)).optional(),
    type: z.enum(['Single', 'Double', 'Suite', 'Deluxe', 'Family']).optional(),
    minPrice: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0)).optional(),
    maxPrice: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0)).optional(),
  }),
});
