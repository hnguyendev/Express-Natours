const Booking = require('../models/bookings.model');
const Tour = require('../models/tours.model');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

const getOverview = catchAsync(async (req, res, next) => {
 //1)get tour data
    const tours = await Tour.find();
 //2) build template

 //3)render
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

const getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('Tour not exist', 404))
    }
    
    res.status(200).render('tour', {
        title: tour.name,
        tour
    });
});

const getLogIn = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    });
}

const getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    })
};

const getMyTours = catchAsync(async (req, res, next) => {
    // find all bookings
    const bookings = await Booking.find({user: req.User.id})


    // find tours with returned ids
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({_id: {$in: tourIDs}});

    res.status(200).render('overview', {
        title: 'My tours',
        tours
    })
})

module.exports = {
    getOverview,
    getTour,
    getLogIn,
    getAccount,
    getMyTours
}