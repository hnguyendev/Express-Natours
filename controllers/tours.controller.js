const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tours.model');
const APIFeatures = require('../utils/apiFeatures');
const {catchAsync} = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteOneHandler, updateOneHandler, createOneHandler, getOneHandler, getAllHandler } = require('./handleFactory');

// function checkID(req, res, next, value) {
//     // console.log(`ID is ${req.params.id}`)
//     // if (req.params.id > tours.length) {
//     //     return res.status(404).json({
//     //         error: 'Invalid id'
//     //     })
//     // }
//     next();
// }

// function checkBody(req, res, next) {
//     if (!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             error: 'Missing property'
//         })
//     }
//     next();
// }

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please update only images!', 400), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

const uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3}
]);

const resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    // imageCover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // images
    req.body.images = [];
    await Promise.all(req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`
        
        await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({quality: 90})
            .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
    }));


    next();
})


const getTourStats = catchAsync(async (req, res, next) => {
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage: {$gte: 4.5}}
            },
            {
                $group: {
                    _id: '$difficulty',
                    numTours: {$sum: 1},
                    numRatings: {$sum: '$ratingsQuantity'},
                    avgRating: {$avg: '$ratingsAverage'},
                    avgPrice: {$avg: '$price'},
                    minPrice: {$min: '$price'},
                    maxPrice: {$max: '$price'}
                }
            },
            {
                $sort: {avgPrice: 1}
            },
            // {
            //     $match: {_id: {$ne: 'easy'}}
            // } // can match multiple times
        ])

        res.status(200).json({
            message: 'success',
            stats
        })
})

const getMonthlyPlan = catchAsync(async (req, res, next) => {
        const year = req.params.year * 1;

        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates' 
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-1-1`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: {$month: '$startDates'},
                    numTours: {$sum: 1},
                    tours: {$push: '$name'}
                }
            },
            {
                $addFields: {month: '$_id'}
            },
            {
                $project: {_id: 0}
            },
            {
                $sort: {numTours: -1}
            },
            // {
            //     $limit: 12
            // }
        ])

        res.status(200).json({
            message: 'success',
            plan
        })
})

const topTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,ratingsAverage,price,difficulty,duration';
    next()
}

//tours-within/:distance/latlng/:ltln/unit/:unit
const getToursWithin = catchAsync(async (req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi'? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        return next(new AppError('Please provide latitude and longitude', 400))
    }
    console.log(distance, lat, lng, unit);

    const tours = await Tour.find({ 
        startLocation: { $geoWithin: {$centerSphere: [[lng, lat], radius]} }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    })
})

const getDistances = catchAsync(async (req, res, next) => {
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        return next(new AppError('Please provide latitude and longitude', 400))
    }
    console.log(lat, lng, unit);

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1 , lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        }, {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    })
})

const getAllTours = getAllHandler(Tour);

const getTour = getOneHandler(Tour, {path: 'reviews'})

const addNewTour = createOneHandler(Tour);

const deleteTour = deleteOneHandler(Tour);

const updateTour = updateOneHandler(Tour);

module.exports = {
    addNewTour,
    getAllTours,
    getTour,
    deleteTour,
    updateTour,
    topTours,
    getTourStats,
    getMonthlyPlan,
    getToursWithin,
    getDistances,
    uploadTourImages,
    resizeTourImages
    // checkID,
    // checkBody
}