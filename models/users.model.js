const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provid a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'guide', 'lead-guide', 'admin']
        },
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // only works on CREATE AND SAVE!
            validator: function(el) {
                return el === this.password;
            },
            message: 'Password not match'
        }
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next()
})

userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
})

userSchema.pre(/^find/, function(next) {
    this.find({active: {$ne: false}});
    next();
})

userSchema.methods.correctPassword = async function(candidatePass, userPass) {
    return await bcrypt.compare(candidatePass, userPass);
}

userSchema.methods.changedPassword = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        
        
        return JWTTimestamp < changeTimestamp;
    }
    
    return false;
}

userSchema.methods.createResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    console.log({resetToken}, this.passwordResetToken)
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // work for 10mins

    return resetToken; // send to email
}

const User = mongoose.model('User', userSchema);

module.exports = User;