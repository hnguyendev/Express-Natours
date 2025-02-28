const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Must have name'],
        unique: true,
        trim: true,
        maxlength: [40, 'Max 40 characters'],
        minlength: [10, 'Min 10 characters'],
        // validate: [validator.isAlpha, 'Must only contain characters']
    },
    slug: String,
    duration: { 
        type: Number,
        required: [true, 'Must have duration'],
    },
    maxGroupSize: { 
        type: Number,
        required: [true, 'Must have group size'],
    },
    difficulty: { 
        type: String,
        required: [true, 'Must have difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Must be ez, med or dif'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Must above 1'],
        max: [5, 'Must below 5'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: { 
        type: Number,
        required: [true, 'Must have price'],
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                // this. not work on update, only on create new doc    
                return val < this.price;       
            },
            message: 'Discount price ({VALUE}) should be below price'
        }
    },
    summary: {
        type: String,
        required: [true, 'Must have summary'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String, //name of image
        required: [true, 'Must have cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        //GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
})

//virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

//document middleware: runs before .save() and .create()
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, {lower: true});
    next();
})


// embedded
// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async (id) => await user.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// })



// tourSchema.pre('save', function(next) {
//     console.log('Save document')
//     next();
// })

// tourSchema.post('save', function(doc, next) {
//     console.log(doc)
//     next();
// })

//QUERY MIDDLEWARE

// tourSchema.index({price: 1})
tourSchema.index({price: 1, ratingsAverage: -1})
tourSchema.index({slug: 1})
tourSchema.index({startLocation: '2dsphere'})

// /^find/ start with the word find
tourSchema.pre(/^find/, function(next) {
    this.find({secretTour: {$ne: true}});

    this.start = Date.now();
    next();
})

// populate
tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next();
})

tourSchema.post(/^find/, function(docs, next) {
    console.log(`Took ${Date.now() - this.start}ms`)
    // console.log(docs)
    next();
})

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
    
    if (this.pipeline().length > 0 && Object.keys(this.pipeline()[0])[0] === '$geoNear') {
        return next();
    }
    this.pipeline().unshift({$match: {secretTour: {$ne: true}}})
    next();
})

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour;