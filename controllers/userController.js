const multer = require('multer');
const moment = require('moment');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteImage, getUploadingSignedURL } = require('../utils/s3');
const {AppDataSource}  = require('../db');
const { User } = require('../models/userEntity');

 const getUserRepo = () => {
  console.log('AppDataSource in user', AppDataSource);

  return AppDataSource.getRepository(User);
};


const getMe = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized to perform this action', 401));
  }
  req.params.id = String(req.user.id);
  next();
};

const updateMe = catchAsync(async (req, res, next) => {
  const files = req.files;

  const user = req.user;
  console.log(
    '🚀 ~ file: userController.js:26 ~ exports.updateMe=catchAsync ~ req:',
    req.body
  );

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  if (files?.photo && files.photo.length > 0) {
    req.body.photo = files.photo[0].key;
  }

  const userRepo = getUserRepo();

  await userRepo.update(Number(user?.id), req.body);

  const updatedUser = await userRepo.findOne({
    where: { id: Number(user?.id) },
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
module.exports ={getUserRepo,updateMe,getMe}