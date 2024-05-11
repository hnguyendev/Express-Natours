const express = require('express');
const { getAllUsers, getUser, deleteUser, updateUser, updateMe, deleteMe, getMe, uploadUserPhoto, resizeUserPhoto } = require('../controllers/users.controller');
const { signUp, logIn, forgotPassword, resetPassword, protect, updatePassword, restrictTo, logOut } = require('../controllers/auth.controller');

const usersRouter = express.Router();

usersRouter.post('/signup', signUp)
usersRouter.post('/login', logIn)
usersRouter.get('/logout', logOut)
usersRouter.post('/forgotpassword', forgotPassword)
usersRouter.patch('/resetpassword/:token', resetPassword)
usersRouter.patch('/updatepassword', protect, updatePassword)


// All route after this will have 'protect'
usersRouter.use(protect)

usersRouter.get('/getme', getMe, getUser);
usersRouter.patch('/updateme', uploadUserPhoto, resizeUserPhoto, updateMe)
usersRouter.delete('/deleteme', deleteMe)

//After this only admin can access
usersRouter.use(restrictTo('admin'))

usersRouter.get('/', getAllUsers);
usersRouter.get('/:id', getUser);
usersRouter.delete('/:id', deleteUser)
usersRouter.patch('/:id', updateUser)

module.exports = usersRouter;