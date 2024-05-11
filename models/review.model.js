const mongoose = require('mongoose');
const Tour = require('./tours.model');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty!']
    },
    rating: {
        type: Number,
        required: true,
        min: [1, 'Review ratings must above 1'],
        max: [5, 'Review ratings must below 5']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour:{
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour']
    },
    user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user']
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true} 
})

reviewSchema.index({tour: 1, user: 1}, {unique: true})

reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next();
})

// function available on the model
reviewSchema.statics.calAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                numRatings: {$sum: 1},
                avgRatings: {$avg: '$rating'}
            }
        }
    ]);
    
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].numRatings,
            ratingsAverage: stats[0].avgRatings
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}

reviewSchema.post('save', function() {
    //point to current doc
    this.constructor.calAverageRatings(this.tour);
    
})

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.clone().findOne();
    next();
})

reviewSchema.post(/^findOneAnd/, async function() {
    await this.r.constructor.calAverageRatings(this.r.tour);
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review;