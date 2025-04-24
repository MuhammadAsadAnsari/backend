const express = require('express');

const { uploadUserImage } = require('../utils/s3');
const {
  addListing,
  getAllListings,
  getListingDetails,
  toggleActiveListing,
  updateListing,
} = require('../controllers/listingController');
const { protect, restrictTo } = require('../controllers/authController');
const { getAllContactUs } = require('../controllers/contactusController');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

router.post('/listing/add', restrictTo('admin'), uploadUserImage, addListing);
router.get('/listing/getAll', restrictTo('admin'), getAllListings);
router.get('/contact/all', restrictTo('admin'), getAllContactUs);

router.get('/listing/details/:slug', restrictTo('admin'), getListingDetails);
router.put(
  '/listing/toggle-active/:slug',
  restrictTo('admin'),
  toggleActiveListing
);
router.put(
  '/listing/update/:slug',
  restrictTo('admin'),
  uploadUserImage,
  updateListing
);

module.exports = router;
