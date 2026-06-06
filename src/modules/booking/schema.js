import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    hotel: z.string({ required_error: 'Hotel ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid hotel ID format'),
    room: z.string({ required_error: 'Room ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid room ID format'),
    firstName: z.string({ required_error: 'First name is required' }).trim().min(1, 'First name cannot be empty'),
    lastName: z.string({ required_error: 'Last name is required' }).trim().min(1, 'Last name cannot be empty'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    checkIn: z.string({ required_error: 'Check-in date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be YYYY-MM-DD'),
    checkOut: z.string({ required_error: 'Check-out date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be YYYY-MM-DD'),
    guests: z.string({ required_error: 'Guests description is required' }),
    nights: z.number({ required_error: 'Number of nights is required' }).min(1),
    subtotal: z.number({ required_error: 'Subtotal is required' }).min(0),
    serviceFee: z.number({ required_error: 'Service fee is required' }).min(0),
    total: z.number({ required_error: 'Total is required' }).min(0),
    requests: z.string().optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Pending', 'Confirmed', 'Cancelled'], {
      required_error: 'Status is required',
    }),
  }),
});
