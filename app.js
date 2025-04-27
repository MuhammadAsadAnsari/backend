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

// Trust proxy for Vercel and proxies
app.enable('trust proxy');

// Force HTTPS redirect (for production)
app.use((req, res, next) => {
  if (
    req.headers['x-forwarded-proto'] !== 'https' &&
    process.env.NODE_ENV === 'production'
  ) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View engine setup (EJS)
app.set('view engine', 'ejs');

// Correct CORS Setup
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://blauda-frontend-z4b6.vercel.app',
  'https://amtrading.jp',
  'https://www.amtrading.jp',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow non-browser requests
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(null, false); // <--- IMPORTANT FIX: soft reject, no throw
      }
    },
    credentials: true,
  })
);

// Security headers
app.use(helmet());
app.use(helmet.frameguard({ action: 'sameorigin' }));

// Logging in dev only
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later!',
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

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// Export app (for Vercel + local)
module.exports = app;
