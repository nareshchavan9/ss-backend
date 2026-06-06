import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    hotel: z.string({ required_error: 'Hotel ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid hotel ID format'),
    rating: z.number({ required_error: 'Rating is required' }).min(1).max(5),
    comment: z.string({ required_error: 'Comment is required' }).trim().min(1, 'Comment cannot be empty'),
  }),
});

export const replyReviewSchema = z.object({
  body: z.object({
    reply: z.string({ required_error: 'Reply text is required' }).trim().min(1, 'Reply cannot be empty'),
  }),
});
