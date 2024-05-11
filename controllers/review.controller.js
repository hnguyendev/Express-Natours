const Review = require("../models/review.model");
const APIFeatures = require("../utils/apiFeatures");
const { catchAsync } = require("../utils/catchAsync");
const { deleteOneHandler, updateOneHandler, createOneHandler, getOneHandler, getAllHandler } = require("./handleFactory");

const getAllReviews = getAllHandler(Review);

const getReview = getOneHandler(Review);

const setTourUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.User.id;
    next();
}
const addNewReview = createOneHandler(Review);

const deleteReview = deleteOneHandler(Review)

const updateReview = updateOneHandler(Review)

module.exports = {
    getAllReviews,
    getReview,
    addNewReview,
    deleteReview,
    updateReview,
    setTourUserIds
}