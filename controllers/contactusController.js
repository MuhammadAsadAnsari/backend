const { NextFunction, Request, Response } = require('express');
const catchAsync = require('../utils/catchAsync');
const { ILike, Repository } = require('typeorm');
const { ContactUs } = require('../models/contactusEntity');
const { AppDataSource } = require('../db');
const AppError = require('../utils/appError');
const { Role, User } = require('../models/userEntity');
const { getUserRepo } = require('./userController');
const Email = require('../utils/email');

const getContactUsRepo = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database is not initialized yet!');
  }
  return AppDataSource.getRepository(ContactUs);
};

const addContactUs = catchAsync(async (req, res, next) => {
  const { name, email, phoneNumber, requirements } = req.body;

  console.log('REQ.BODY', name, email, phoneNumber, req.body);

  if (!name || !email || !phoneNumber || !requirements)
    return next(new AppError('All fields are required', 400));
  
  const ContactUsRepo = getContactUsRepo();
  
  // Get the latest ID
  const lastContact = await ContactUsRepo.findOne({
    where: {},
    // order: { id: 'DESC' }, // Get the most recent entry
  });


  const newId = (lastContact?.id ?? 0) + 1;
console.log('newId', newId, lastContact);
  // Create new ContactUs entity
  const data = ContactUsRepo.create({
    name,
    email,
    phoneNumber,
    requirements,
    slug: `contactUs-${newId}`, // Generate slug dynamically
  });

  await ContactUsRepo.save(data);

  // Get admin users and send emails
  const userRepo = getUserRepo();
  const foundAdmins = await userRepo.find({
    where: { role: Role.ADMIN },
  });

  console.log('🚀 ~ admins:', foundAdmins);

  // Send query email to all admins
  await Promise.all(
    foundAdmins.map(
      async (admin) => await new Email(admin, 'url').sendQueryEmail()
    )
  );

  return res.status(201).json({ success: true, data });
});

const getAllContactUs = catchAsync(async (req, res, next) => {
  const contactUsRepo = getContactUsRepo();

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 400;
  const skip = (page - 1) * limit;

  const search = req.query.search;

  console.log('🚀 ~ getAllContactUs ~ search:', typeof search);

  let data;
  if (search) {
    // Search with `ILIKE` for case-insensitive searching
    data = await contactUsRepo.findAndCount({
      order: { id: 'DESC' },
      where: [
        { name: ILike(`%${search}%`) },
        { email: ILike(`%${search}%`) },
        { phoneNumber: ILike(`%${search}%`) },
      ],
      select: ['name', 'email', 'phoneNumber', 'requirements'],
      take: limit,
      skip: skip,
    });
  } else {
    data = await contactUsRepo.findAndCount({
      select: ['name', 'email', 'phoneNumber', 'requirements'],
      take: limit,
      skip: skip,
      order: { id: 'DESC' },
    });
  }

  if (!data) return next(new AppError('No Queries found', 400));

  return res
    .status(200)
    .json({ success: true, data: data[0], totalRecords: data[1] });
});

module.exports = { addContactUs, getAllContactUs };
