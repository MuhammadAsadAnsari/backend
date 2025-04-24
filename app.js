const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');
const contactUsRouter = require('./routes/contactusRoute');
const listingRouter = require('./routes/listingRoutes');

const app = express();

// Set trust proxy
app.enable('trust proxy');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View engine setup (using EJS)
app.set('view engine', 'ejs');

// Global Middlewares
app.use(cors());
app.options('*', cors());

// Set security HTTP headers
app.use(helmet());
app.use(helmet.frameguard({ action: 'sameorigin' }));

// Logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  max: 100, // adjust as needed
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Compression
app.use(compression());


// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to AM car selling APIs',
  });
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/contact-us', contactUsRouter);
app.use('/api/v1/listing', listingRouter);

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// Export app
module.exports = app;
