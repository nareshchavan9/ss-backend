import { z } from 'zod';

export const createPayoutMethodSchema = z.object({
  body: z.object({
    type: z.enum(['Bank Transfer', 'PayPal'], {
      required_error: 'Payout type is required',
    }),
    name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Name cannot be empty'),
    details: z.string({ required_error: 'Details are required' }).trim().min(1, 'Details cannot be empty'),
    isDefault: z.boolean().optional(),
  }),
});

export const createPaymentCardSchema = z.object({
  body: z.object({
    cardholder: z.string({ required_error: 'Cardholder name is required' }).trim().min(1, 'Cardholder name cannot be empty'),
    number: z.string({ required_error: 'Card number is required' }).trim().min(1, 'Card number cannot be empty'),
    expiry: z.string({ required_error: 'Expiry is required' }).trim().min(1, 'Expiry cannot be empty'),
    type: z.string({ required_error: 'Card type is required' }).trim().min(1, 'Card type cannot be empty'),
    color: z.string({ required_error: 'Color is required' }).trim().min(1, 'Color cannot be empty'),
  }),
});
