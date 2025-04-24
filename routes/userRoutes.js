const express = require('express');
const multer = require('multer');
const { getMe, updateMe } = require('./../controllers/userController');
const {
  signup,
  forgotPassword,
  resetPassword,
  verifyMe,
  verifyForgotPasswordOtp,
  resendOtp,
  me,
  logout,
  updatePassword,
  adminLogin,
} = require('./../controllers/authController');
const { protect, restrictTo } = require('../controllers/authController');
const { uploadUserImage } = require('../utils/s3');

const router = express.Router();

// signup and login apis
router.post('/signup', signup);
router.post('/admin-login', adminLogin);

router.post('/forgotPassword', forgotPassword);
router.get('/resetPassword/:token', resetPassword);
router.post('/verify-me', verifyMe);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);

router.post('/resend-otp', resendOtp);

// Protect all routes after this middleware with token
router.use(protect);

router.get('/me', me);

// logout api
router.post('/logout', logout);

// update password api
router.put('/updateMyPassword', updatePassword);

// update me api
router.put('/updateMe', restrictTo('user', 'admin'), uploadUserImage, updateMe);

router.use(restrictTo('admin'));

// router
//   .route('/delete-vibe-guide/:id')
//   .delete(userController.adminDeleteVibeGuide);

module.exports = router;
