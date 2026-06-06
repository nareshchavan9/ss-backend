import './src/config/dotenv.js';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import winston from 'winston';
import './src/config/redis.js'; // Trigger Redis connection

const PORT = process.env.PORT || 5000;

// Connect to DB and start Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      winston.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  })
  .catch((error) => {
    winston.error(`Server failed to start due to MongoDB connection issue: ${error.message}`);
    process.exit(1);
  });
