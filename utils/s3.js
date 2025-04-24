const S3 = require('aws-sdk/clients/s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const AppError = require('./appError');

const imageBucket = 'car-development';
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// File filter for PDFs and images
const multerPdfFilter = (req, file, cb) => {
  console.log('📦 ~ multerPdfFilter ~ file:', file.mimetype);
  if (
    file.mimetype.startsWith('image') ||
    file.mimetype.startsWith('application/pdf') ||
    file.mimetype.startsWith('video/mp4') ||
    file.mimetype.startsWith('video/quicktime') ||
    file.mimetype.startsWith('audio/mpeg') ||
    file.mimetype.startsWith('image/svg+xml') ||
    file.mimetype.startsWith('image/jpg') ||
    file.mimetype.startsWith('image/jpeg') ||
    file.mimetype.startsWith('image/png')
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid mimetype.', 400), false);
  }
};

// Upload PDFs


// Upload Images
const uploadImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: imageBucket,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      let type;
      if (file?.mimetype === 'image/jpg') type = 'jpg';
      else if (file?.mimetype === 'image/jpeg') type = 'jpeg';
      else if (file?.mimetype === 'image/png') type = 'png';
      cb(null, `${uuidv4()}.${type}`);
    },
  }),
  limits: { fileSize: 3000000 }, // 3MB
  fileFilter: multerPdfFilter,
});

const uploadUserImage = uploadImage.fields([
  { name: 'photos' },
  { name: 'photo' },
]);

// Signed URL generator
const getUploadingSignedURL = async (Key, Expires = 15004) => {
  try {
    const url = await s3.getSignedUrlPromise('putObject', {
      Bucket: imageBucket,
      Key,
      Expires,
    });
    return url;
  } catch (error) {
    return error;
  }
};

// Stream file download
const getFileStream = (fileKey) => {
  const downloadParams = {
    Key: fileKey,
    Bucket: imageBucket,
  };

  return s3.getObject(downloadParams).createReadStream();
};

// Delete image
const deleteImage = (fileKey) => {
  if (['default.png'].includes(fileKey)) return;

  const deleteParams = {
    Key: fileKey,
    Bucket: imageBucket,
  };

  return s3.deleteObject(deleteParams).promise();
};
module.exports= {uploadUserImage,deleteImage}
