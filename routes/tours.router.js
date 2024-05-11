const express = require('express');
const { getAllTours, getTour, deleteTour, updateTour, topTours, getTourStats, getMonthlyPlan, addNewTour, getToursWithin, getDistances, uploadTourImages, resizeTourImages} = require('../controllers/tours.controller');
const { protect, restrictTo } = require('../controllers/auth.controller');
const reviewRouter = require('./reviews.router');

const toursRouter = express.Router();

toursRouter.use('/:tourId/reviews', reviewRouter)

// toursRouter.param('id', checkID)

toursRouter.route('/top-5-cheap').get(topTours, getAllTours)

toursRouter.route('/tour-stats').get(getTourStats, getAllTours)

toursRouter.route('/monthly-plan/:year').get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan, getAllTours)

toursRouter.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(getToursWithin) 

toursRouter.route('/distance/:latlng/unit/:unit')
    .get(getDistances)


toursRouter.route('/')
    .get(getAllTours)
    .post(protect, restrictTo('admin', 'lead-guide'), addNewTour)

toursRouter.route('/:id')
    .get(getTour)
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour)
    .patch(protect, restrictTo('admin', 'lead-guide'), uploadTourImages, resizeTourImages, updateTour)

// toursRouter.route('/:tourId/reviews')
//     .post(protect, restrictTo('user'), addNewReview)

module.exports = toursRouter;