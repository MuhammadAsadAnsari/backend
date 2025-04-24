const express = require('express');
const { uploadUserImage } = require('../utils/s3');
const { restrictTo } = require('../controllers/authController');
const {
  getListingDetailsForUser,
  getAllListingsForHomePage,
  getListingsCount,
  getAllListingsForUser,
  getAllRecommendedListingsForUser,
} = require('../controllers/listingController');

const router = express.Router();

router.get('/home', getAllListingsForHomePage);
router.get('/details/:slug', getListingDetailsForUser);
router.post('/all', getAllListingsForUser);
router.post('/recommended/all/:slug', getAllRecommendedListingsForUser);
router.get('/count', getListingsCount);

module.exports = router;
