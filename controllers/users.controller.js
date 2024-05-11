const multer = require('multer');
const sharp = require('sharp');
const User = require("../models/users.model");
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const { deleteOneHandler, updateOneHandler, getOneHandler, getAllHandler } = require("./handleFactory");

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users')
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.User.id}-${Date.now()}.${ext}`);
//     } 
// });

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

const uploadUserPhoto = upload.single('photo');

const resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.User.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/users/${req.file.filename}`)
    
    next();
});

const filterObj = (obj, ...allowed) =>{
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowed.includes(el)) newObj[el] = obj[el];
    })
    return newObj;
}

const updateMe = catchAsync(async (req, res, next) => {
    // 1) create error if post password
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('Not for password update', 400))
    }
    
    // 2) update
    const filter = filterObj(req.body, 'name', 'email')
    if (req.file) filter.photo = req.file.filename;
 
    const update = await User.findByIdAndUpdate(req.User.id, filter, {
        new: true,
        runValidators: true
    })
    res.status(200).json({
        status: 'success',
        update
    })
})


const getAllUsers = getAllHandler(User);

const getUser = getOneHandler(User);

const deleteUser = deleteOneHandler(User);

const updateUser = updateOneHandler(User);

const getMe = (req, res, next) => {
    req.params.id = req.User.id;
    next();
}

const deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.User.id, {active: false});

    res.status(204).json({
        status: 'success'
    })
})

module.exports = {
    getAllUsers,
    getUser,
    deleteUser,
    updateUser,
    updateMe,
    deleteMe,
    getMe,
    uploadUserPhoto,
    resizeUserPhoto
}