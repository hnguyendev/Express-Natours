const express = require('express');
const { getOverview, getTour, getLogIn, getAccount, getMyTours } = require('../controllers/views.controller');
const { protect, isLoggedIn } = require('../controllers/auth.controller');
const { createBookingCheckout } = require('../controllers/bookings.controller');

const viewsRouter = express.Router();

viewsRouter.get('/', createBookingCheckout, isLoggedIn, getOverview );
viewsRouter.get('/tour/:slug', isLoggedIn, getTour );

// login
viewsRouter.get('/login', isLoggedIn, getLogIn)
viewsRouter.get('/me', protect, getAccount );
viewsRouter.get('/my-tours', protect, getMyTours );

module.exports = viewsRouter;