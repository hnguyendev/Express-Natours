const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
    const message = `Duplicate value ${value}`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data ${errors.join('. ')}`;
    return new AppError(message, 400)
}

const handleJWTError = err => {
    return new AppError('Invalid token! Please login again!', 401)
}

const handleJWTExpireError = err => {
    return new AppError('Your token has expired! Please login again!', 401)
}

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        })
    }
    console.error('ERROR', err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
    });
}

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // trusted, known error
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        // unexpected error
        console.error('ERROR', err);
    
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        })
        
        // unexpected error
    }
    console.error('ERROR', err);
    
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later!'
    });
}


function globalErrorHandler(err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res)
    } else if (process.env.NODE_ENV === 'production') {
        if (err.name === 'CastError') err = handleCastErrorDB(err)
        if (err.code === 11000) err = handleDuplicateFieldsDB(err)
        if (err.name === 'ValidationError') err = handleValidationErrorDB(err)
        if (err.name === 'JsonWebTokenError') err = handleJWTError(err)
        if (err.name === 'TokenExpiredError') err = handleJWTExpireError(err);

        sendErrorProd(err, req, res)
    }
}

module.exports = {
    globalErrorHandler
}