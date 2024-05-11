const Booking = require("../models/bookings.model");
const Tour = require("../models/tours.model");
const { catchAsync } = require("../utils/catchAsync")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const getCheckoutSession = catchAsync(async (req, res, next) => {
    // get booked tour
    const tour = await Tour.findById(req.params.tourId);

    // create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.User.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.User.email,
        client_reference_id: req.params.tourId,

        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
                    }
                }
            }
        ],
        mode: 'payment'
    });
    
    // create session as response
    res.status(200).json({
        status: 'success',
        session
    })
});

const createBookingCheckout = catchAsync(async (req, res, next) => {
    const {tour, user, price} = req.query;

    if (!tour && !user && !price) return next();
    await Booking.create({tour, user, price});

    res.redirect(req.originalUrl.split('?')[0]);
})

module.exports = {
    getCheckoutSession,
    createBookingCheckout
}