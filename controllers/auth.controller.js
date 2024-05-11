const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const crypto = require('crypto');

const User = require("../models/users.model");
const {catchAsync} = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    })
}



const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions)

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

const signUp = catchAsync(async (req, res, next) => {
    const {name, email, password, passwordConfirm, role} = req.body;
    const newUser = await User.create({
        name,
        email,
        password,
        passwordConfirm
    });
    
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
});

const logIn = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return next(new AppError('Provide email and password'), 400)
    }

    // check if user exists && pass is correct
    const user = await User.findOne({email}).select('+password')

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401))
    }

    createSendToken(user, 200, res);
    
});

const logOut = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    res.status(200).json({
        status: 'success'
    })
};

const protect = catchAsync(async (req, res, next) => {
    // 1) getting token and check
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in!', 401))
    }

    // 2) verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // 3) check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('User no longer exist', 401))
    }

    // 4) if user changed password if token was issued
    if (currentUser.changedPassword(decoded.iat)) {
        return next(new AppError('User recently changed password! Login again!', 401))
    }
    
    // pass
    req.User = currentUser;
    res.locals.user = currentUser;
    next();
});

// for rendering pages
const isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1)verify token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            
            // 2) check if user still exists
            const currentUser = await User.findById(decoded.id)
            if (!currentUser) {
                return next();
            }
        
            // 3) if user changed password if token was issued
            if (currentUser.changedPassword(decoded.iat)) {
                return next();
            }
            
            // pass => logged in
            res.locals.user = currentUser;
            return next();
        } catch(err) {
            return next();
        }
    }
    next();
}

const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']
        if (!roles.includes(req.User.role)) {
            return next(new AppError('You dont have permission!', 403))
        }

        next();
    }
}

const forgotPassword = catchAsync(async (req, res, next) => {
    // 1) get user email
    const user = await User.findOne({email: req.body.email})

    if (!user) {
        return next (new AppError('User not found', 404))
    }
    // 2_ generate token
    const resetToken = user.createResetToken();
    await user.save({validateBeforeSave: false});

    // 3)  send to user's email;
    
    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`
        // const message = `Please submit to ${resetURL} to change your password! If you didnt forget , please ignore this email!`
        await new Email(user, resetURL).sendPasswordReset();
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    } catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('Error sending email! Try later!', 500))
    }
})

const resetPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: { $gte: Date.now() }})
    
    // 2) If token not expired && there is user => set new password
    if (!user) {
        return next(new AppError('Token invalid or expired', 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt

    // 4) Log the user in , send JWT
    createSendToken(user, 200, res);
})

const updatePassword = catchAsync(async (req, res , next) => {
    // 1)find user
    const currentUser = await User.findById(req.User.id).select('+password');

    // 2) check post password
    if (!(await currentUser.correctPassword(req.body.passwordCurrent, currentUser.password))) {
        return next(new AppError('Incorrect password! Try again!', 401))
    }

    // 3) update
    currentUser.password = req.body.password;
    currentUser.passwordConfirm = req.body.passwordConfirm;
    await currentUser.save();

    // 4) send jwt
    createSendToken(currentUser, 200, res);
})

module.exports = {
    signUp,
    logIn,
    protect,
    restrictTo,
    forgotPassword,
    resetPassword,
    updatePassword,
    isLoggedIn,
    logOut
}