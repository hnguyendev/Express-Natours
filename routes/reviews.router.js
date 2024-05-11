const express = require('express')
const { getAllReviews, addNewReview, deleteReview, updateReview, setTourUserIds, getReview } = require('../controllers/review.controller')
const { protect, restrictTo } = require('../controllers/auth.controller')

const reviewRouter = express.Router({ mergeParams: true })

reviewRouter.use(protect)

reviewRouter.route('/')
    .get(getAllReviews)
    .post(restrictTo('user'), setTourUserIds, addNewReview)

reviewRouter.route('/:id')
    .get(getReview)
    .patch(restrictTo('user', 'admin'), updateReview)
    .delete(restrictTo('user', 'admin'), deleteReview)

module.exports = reviewRouter;