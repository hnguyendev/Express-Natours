const express = require('express');
const morgan = require('morgan')
const path = require('path')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const toursRouter = require('./routes/tours.router');
const usersRouter = require('./routes/users.router');
const AppError = require('./utils/appError');
const {globalErrorHandler} = require('./controllers/err.controller');
const reviewRouter = require('./routes/reviews.router');
const viewsRouter = require('./routes/views.router');
const bookingRouter = require('./routes/bookings.router');

const app = express();

app.use(cors({
    origin: 'http://localhost:8080'
}));

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))

// set HTTP headers
app.use(helmet({
    contentSecurityPolicy: false
}))

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests, please try again in 1hr!'
})
app.use('/api', limiter)

// body parser
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// data sanitize against nosql query injection
app.use(mongoSanitize())

// data santitize against XSS
app.use(xss())

// prevent parameter pollution
app.use(hpp({
    whitelist: [
        'duration', 'ratingsQuantity', 'ratingsAverage',
        'maxGroupSize', 'difficulty', 'price'
    ]
}))

app.use((req, res, next) => {
    console.log('Middleware!')
    // console.log(req.headers)
    next();
})

// ROUTE
app.use(viewsRouter)
app.use('/api/v1/tours', toursRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

app.all('*', (req, res, next) => {
    next(new AppError(`Cant find ${req.originalUrl}`, 404)); //skip all middleware and go to err middle
})

app.use(globalErrorHandler)

console.log(process.env.NODE_ENV)

module.exports = app;