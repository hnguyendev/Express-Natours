const express = require('express')
const { protect, restrictTo } = require('../controllers/auth.controller');
const { getCheckoutSession } = require('../controllers/bookings.controller');

const bookingRouter = express.Router();

bookingRouter.get('/checkout-session/:tourId', protect, getCheckoutSession)

module.exports = bookingRouter;
