import './config/dotenv.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import winston from 'winston';

// Configure default winston logger
winston.configure({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

import errorHandler from './middlewares/errorHandler.js';
import authRouter from './modules/auth/routes.js';
import hotelRouter from './modules/hotel/routes.js';
import roomRouter from './modules/room/routes.js';
import bookingRouter from './modules/booking/routes.js';
import reviewRouter from './modules/review/routes.js';
import paymentMethodRouter from './modules/paymentMethod/routes.js';
import wishlistRouter from './modules/wishlist/routes.js';
import foodOrderRouter from './modules/foodOrder/routes.js';

const app = express();

// Middlewares
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/hotels', hotelRouter);
app.use('/api/v1/rooms', roomRouter); // Mount for /rooms/available
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/payment-methods', paymentMethodRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/food-orders', foodOrderRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
