'use strict';

const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { AppDataSource } = require('../db');
const bcrypt = require('bcrypt');
const { Role, User } = require('../models/userEntity');

const getUserRepo = () => {
  console.log('AppDataSource', AppDataSource);
  if (!AppDataSource.isInitialized) {
    throw new Error('Database is not initialized yet!');
  }
  return AppDataSource.getRepository(User);
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
  });
};

const expireToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: 5 });
};

const createSendToken = (user, statusCode, req, res, resetPasswordDone) => {
  const token = signToken(String(user?.id));
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });
  delete user?.password;
  res.status(statusCode).json({
    status: 'success',
    token,
    ...(resetPasswordDone && { isLoggedIn: true }),
    data: { user },
  });
};

const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return next(new AppError('User already Exist.', 400));
  const userRepo = getUserRepo();
  const foundUser = await userRepo.findOne({ where: { email } });
  if (foundUser) return next(new AppError('User already Exist.', 400));
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = userRepo.create({
    name,
    email,
    password: hashedPassword,
    role,
  });
  await userRepo.save(newUser);
  createSendToken(newUser, 201, req, res, false);
});

const adminLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('All fields required.', 400));
  const userRepo = getUserRepo();
  const user = await userRepo.findOne({
    where: { email },
    select: ['id', 'name', 'email', 'password', 'role', 'photo'],
  });
  if (!user)
    return next(new AppError('No user is specified with this email.', 401));
  if (user.role === Role.USER)
    return next(new AppError('Not a user route.', 401));
  if (!user.password) return next(new AppError('Password not found', 500));
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return next(new AppError('Incorrect email or password', 401));
  const token = signToken(String(user.id));
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  delete user.password;
  res.status(200).json({ status: 'success', token, data: { user } });
});

const logout = catchAsync(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  const expiredToken = expireToken(req.user?._id);
  res.status(200).json({ status: 'success', data: expiredToken });
});

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next(new AppError('You are not logged in!', 401));
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userRepo = getUserRepo();
  const currentUser = await userRepo.findOne({
    where: { id: Number(decoded?.id) },
  });
  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

const isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
      const currentUser = 'await User.findById(decoded.id)';
      if (!currentUser) return next();
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user)
      return next(new AppError('Not authorized to perform this action', 401));
    if (!roles.includes(req.user.role))
      return next(new AppError('You do not have permission', 403));
    next();
  };
};

const forgotPassword = catchAsync(async (req, res, next) => {
  const email = req.body.email;

  const user = 'await User.findOne({ email: req.body.email })'; // Placeholder

  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000);
    const resetCode = 'Your password reset code is ' + code;

    // Save code to user (this is placeholder logic)
    user = '';

    res.status(200).json({
      status: 'success',
      message: 'Code sent to email!',
    });
  } catch (err) {
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

const verifyMe = catchAsync(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  const updatedUser =
    ' await User.findOneAndUpdate({ email, verificationCode }, { isVerified: true }, { new: true })'; // Placeholder

  if (!updatedUser) return next(new AppError('Invalid Verification Code', 500));

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

const me = catchAsync(async (req, res, next) => {
  const user = req.user;
  const userRepo = getUserRepo();

  const foundUser = await userRepo.findOne({
    where: { id: user?.id },
    select: ['id', 'email', 'password', 'role', 'name', 'photo'],
  });

  res.status(200).json({
    status: 'success',
    data: foundUser,
  });
});
const verifyForgotPasswordOtp = catchAsync(async (req, res, next) => {
  const { email, otpCode } = req.body;

  const doc =
    ' await User.findOneAndUpdate({ email, passwordResetCode: otpCode }, { passwordResetCode: null }, { new: true })'; // Placeholder

  if (!doc) return next(new AppError('Invalid Code', 400));

  res.status(200).json({
    status: 'success',
    data: doc,
  });
});
const resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const otpCode = Math.floor(1000 + Math.random() * 9000);

  const updatedUser =
    'await User.findOneAndUpdate({ email }, { verificationCode: otpCode }, { new: true })'; // Placeholder

  if (!updatedUser) return next(new AppError('Error while sending', 400));

  res.status(200).json({
    status: 'success',
    message: 'Otp Successfully Resend',
    data: updatedUser,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.query;

  res.render('password-page', { token });
});

const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from request
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new AppError('All fields are required.', 400));
  }

  if (newPassword !== confirmNewPassword) {
    return next(
      new AppError('New password and confirm password do not match.', 400)
    );
  }

  const user = req.user;
  const userRepo = getUserRepo();

  const foundUser = await userRepo.findOne({
    where: { email: user?.email },
    select: ['id', 'name', 'email', 'password', 'role', 'photo'], // Ensure 'id' is included
  });

  if (!foundUser) {
    return next(new AppError('User not found.', 404));
  }

  // 2) Check if provided current password is correct
  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    String(foundUser.password)
  );
  if (!isPasswordValid) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  // 3) Update password with hashing
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await userRepo.update(foundUser.id, { password: hashedPassword });

  // Remove password from response object before sending it back to the client
  delete foundUser.password;

  // 4) Respond to client
  createSendToken(foundUser, 200, req, res, true);
});
module.exports = {
  signup,
  adminLogin,
  logout,
  protect,
  isLoggedIn,
  restrictTo,
  forgotPassword,
  verifyMe,
  me,
  verifyForgotPasswordOtp,
  resendOtp,
  resetPassword,
  updatePassword
};

// The rest like forgotPassword, verifyMe, me, updatePassword, etc. will follow the same conversion style...
