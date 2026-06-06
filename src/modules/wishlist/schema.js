import { z } from 'zod';

export const toggleWishlistSchema = z.object({
  body: z.object({
    hotelId: z.string({ required_error: 'Hotel ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid hotel ID format'),
  }),
});
