const express = require('express');
const { addContactUs } = require('../controllers/contactusController');

const router = express.Router();

router.post('/', addContactUs);

module.exports = router;
