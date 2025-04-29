const  catchAsync  = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const  {AppDataSource}  = require('../db');
const { Listing } = require('../models/listingEntity');
const { deleteImage } = require('../utils/s3');
const getListingRepo = () => {

  return AppDataSource.getRepository(Listing);
};


const addListing = catchAsync(async (req, res, next) => {
  const {
    location,
    city,
    offerNo,
    chassisNo,
    carStatus,
    make,
    model,
    grade,
    modelYear,
    manufactured,
    firstRegistrationDate,
    engineSize,
    mileage,
    seats,
    driveType,
    bodyType,
    steering,
    transmission,
    color,
    price,
    fuelType,
    name,
    From,
  } = req.body;
  const files = req.files; // assuming photos are uploaded

  if (!files?.photos)
    return next(new AppError('Minimum one photo is required', 400));

  if (
    !location ||
    !city ||
    !offerNo ||
    !chassisNo ||
    !carStatus ||
    !make ||
    !model ||
    !grade ||
    !modelYear ||
    !manufactured ||
    !firstRegistrationDate ||
    !engineSize ||
    !mileage ||
    !seats ||
    !driveType ||
    !bodyType ||
    !steering ||
    !transmission ||
    !color ||
    !price ||
    !fuelType ||
    !name ||
    !From
  )
    return next(new AppError('All fields are required', 400));

  const listingRepo = getListingRepo();

  const listingExist = await listingRepo.findOne({ where: { chassisNo } });
    console.log('🚀 ~ addListing ~ listingExist:', listingExist);

  if (listingExist) {
    return next(new AppError('Chassis number already exists', 400));
  }

  const photos = files.photos.map((photo) => photo.key);

  const newListing = listingRepo.create({
    location: location.toLowerCase(),
    city: city.toLowerCase(),
    offerNo: offerNo.toLowerCase(),
    chassisNo: chassisNo.toLowerCase(),
    carStatus: carStatus.toLowerCase(),
    make: make.toLowerCase(),
    model: model.toLowerCase(),
    grade: grade.toLowerCase(),
    modelYear,
    manufactured: manufactured.toLowerCase(),
    firstRegistrationDate: firstRegistrationDate.toLowerCase(),
    engineSize: engineSize.toLowerCase(),
    mileage,
    seats: seats.toLowerCase(),
    driveType: driveType.toLowerCase(),
    bodyType: bodyType.toLowerCase(),
    steering: steering.toLowerCase(),
    transmission: transmission.toLowerCase(),
    color: color.toLowerCase(),
    price: price.toLowerCase(),
    fuelType: fuelType.toLowerCase(),
    name: name.toLowerCase(),
    status: 'Active',
    photos,
    From,
  });

  await listingRepo.save(newListing);

  newListing.slug = `AtoB-${newListing.id}`;
  await listingRepo.save(newListing);

  return res.status(201).json({ success: true, data: newListing });
});

const getAllListings = catchAsync(async (req, res, next) => {
  const listingRepo = getListingRepo();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 400;
  const skip = (page - 1) * limit;

  const search = req.query.search;

  let listings;
  if (search) {
    listings = await listingRepo.findAndCount({
      select: [
        'slug',
        'make',
        'model',
        'color',
        'price',
        'fuelType',
        'name',
        'status',
      ],
      where: [
        { name: `%${search}%` },
        { chassisNo: `%${search}%` },
        { make: `%${search}%` },
        { model: `%${search}%` },
        { color: `%${search}%` },
      ],
      take: limit,
      skip,
      order: { id: 'DESC' },
    });
  } else {
    listings = await listingRepo.findAndCount({
      select: [
        'slug',
        'make',
        'model',
        'color',
        'price',
        'fuelType',
        'name',
        'status',
      ],
      take: limit,
      skip,
      order: { id: 'DESC' },
    });
  }

  if (!listings) return next(new AppError('No listings found', 400));

  return res
    .status(200)
    .json({ success: true, data: listings[0], totalRecords: listings[1] });
});

const getListingDetails = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const listingRepo = getListingRepo();

  const listing = await listingRepo.findOne({ where: { slug } });

  if (!listing) return next(new AppError('Listing not found', 404));

  return res.status(200).json({
    status: 'success',
    data: { listing },
  });
});

const toggleActiveListing = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!status) return next(new AppError('Please provide a status', 404));

  const slug = req.params.slug;
  const listingRepo = getListingRepo();

  const listing = await listingRepo.findOne({ where: { slug } });

  if (!listing) return next(new AppError('Listing not found', 404));

  if (listing.status === status)
    return next(new AppError('Status already set', 400));

  listing.status = status;
  await listingRepo.save(listing);

  return res.status(200).json({
    status: 'success',
    data: { listing },
  });
});

const updateListing = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;

  const files = req.files;

  const listingRepo = getListingRepo();

  const listing = await listingRepo.findOne({ where: { slug } });

  if (!listing) return next(new AppError('Listing not found', 404));

  // Ensure body is parsed
  if (typeof req.body.data === 'string') {
    req.body.data = JSON.parse(req.body.data);
      await Promise.all(listing.photos.map((photo) => deleteImage(photo)));

  }
  console.log("req.body",req.body)

  if (files.photos) {
    req.body.data.photos = files.photos.map((photo) => photo.key);
  }

  Object.assign(listing, req.body.data);

  await listingRepo.save(listing);

  return res.status(200).json({
    status: 'success',
    data: { listing },
  });
});

const getListingDetailsForUser = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const listingRepo = getListingRepo();

  const listing = await listingRepo.findOne({
    where: { slug, status: 'Active' },
    select: [
      'make',
      'model',
      'location',
      'city',
      'offerNo',
      'chassisNo',
      'carStatus',
      'grade',
      'modelYear',
      'manufactured',
      'firstRegistrationDate',
      'engineSize',
      'mileage',
      'seats',
      'driveType',
      'bodyType',
      'steering',
      'transmission',
      'color',
      'price',
      'fuelType',
      'name',
      'photos',
      'From',
    ],
  });

  if (!listing) return next(new AppError('Listing not found', 404));

  return res.status(200).json({
    status: 'success',
    data: { listing },
  });
});

const getAllListingsForHomePage = catchAsync(async (req, res, next) => {
  const listingRepo = getListingRepo();

  const recommendedListings = await listingRepo.find({
    where: { status: 'Active' },
    select: [
      'slug',
      'name',
      'modelYear',
      'city',
      'location',
      'price',
      'photos',
    ],
    order: { id: 'DESC' },
    take: 10,
  });

  if (!recommendedListings)
    return next(new AppError('No recommended listings found', 404));

  const dubaiListings = await listingRepo.find({
    where: { From: 'Dubai', status: 'Active' },
    select: [
      'slug',
      'name',
      'modelYear',
      'city',
      'location',
      'price',
      'photos',
    ],
    order: { id: 'DESC' },
    take: 10,
  });

  if (!dubaiListings) return next(new AppError('No Dubai listings found', 404));

  const japanListings = await listingRepo.find({
    where: { From: 'Japan', status: 'Active' },
    select: [
      'slug',
      'name',
      'modelYear',
      'city',
      'location',
      'price',
      'photos',
    ],
    order: { id: 'DESC' },
    take: 10,
  });

  if (!japanListings) return next(new AppError('No Japan listings found', 404));

  const thailandListings = await listingRepo.find({
    where: { From: 'Thailand', status: 'Active' },
    select: [
      'slug',
      'name',
      'modelYear',
      'city',
      'location',
      'price',
      'photos',
    ],
    order: { id: 'DESC' },
    take: 10,
  });

  if (!thailandListings)
    return next(new AppError('No Thailand listings found', 404));

  return res.status(200).json({
    status: 'success',
    data: {
      recommendedListings,
      dubaiListings,
      japanListings,
      thailandListings,
    },
  });
});

const getListingsCount = catchAsync(async (req, res, next) => {
  const listingRepo = getListingRepo();

  const data = await listingRepo.count({ where: { status: 'Active' } });

  return res.status(200).json({
    status: 'success',
    data,
  });
});
const getAllListingsForUser = catchAsync(async (req, res, next) => {
  const listingRepo = getListingRepo();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 400;
  const skip = (page - 1) * limit;

  const {
    make,
    model,
    color,
    bodyType,
    minYear,
    maxYear,
    minKm,
    maxKm,
    transmission,
    fuelType,
    search,
    From,
  } = req.body;

  console.log('🚀 ~ getAllListings ~ search:', make, model);

  // Apply search filter
  let whereConditions = {
    ...(make && { make: make.toLowerCase() }),
    ...(model && { model: model.toLowerCase() }),
    ...(color && { color: color.toLowerCase() }),
    ...(bodyType && { bodyType: bodyType.toLowerCase() }),
    ...(transmission && { transmission: transmission.toLowerCase() }),
    ...(fuelType && { fuelType: fuelType.toLowerCase() }),
    ...(From && From !== 'all' && { From }),
    status: 'Active',
    ...(minYear && { modelYear: MoreThanOrEqual(minYear) }),
    ...(maxYear && { modelYear: LessThanOrEqual(maxYear) }),

    // Apply mileage conditions
    ...(minKm && { mileage: MoreThanOrEqual(minKm) }),
    ...(maxKm && { mileage: LessThanOrEqual(maxKm) }),
  };
  if (search) {
    whereConditions = [
      { name: ILike(`%${search}%`) },
      { chassisNo: ILike(`%${search}%`) },
      { make: ILike(`%${search}%`) },
      { model: ILike(`%${search}%`) },
      { color: ILike(`%${search}%`) },
    ];
  }

  // Apply other filters dynamically
  const listings = await listingRepo.findAndCount({
    select: [
      'slug',
      'name',
      'modelYear',
      'chassisNo',
      'steering',
      'price',
      'photos',
      'fuelType',
      'color',
      'mileage',
      'model',
    ],
    where: whereConditions,
    take: limit,
    skip: skip,
    order: { id: 'DESC' },
  });

  if (!listings) return next(new AppError('No listings found', 400));

  return res
    .status(200)
    .json({ success: true, data: listings[0], totalRecords: listings[1] });
});

const getAllRecommendedListingsForUser = catchAsync(
  async (req, res, next) => {
    const listingRepo = getListingRepo();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 400;
    const skip = (page - 1) * limit;

    const slug = req.params.slug;

    const model = req.body.model;

    if (!slug) return next(new AppError('Please provide car slug', 404));

    const foundListing = await listingRepo.findOne({
      where: { slug, status: 'Active' },
    });

    if (!foundListing) return next(new AppError('Car not found', 404));

    const listings = await listingRepo.findAndCount({
      select: [
        'slug',
        'name',
        'modelYear',
        'chassisNo',
        'steering',
        'price',
        'photos',
        'fuelType',
        'color',
        'mileage',
        'model',
      ],
      where: {
        model: ILike(`%${model}%`),
        slug: Not(slug),
      },
      take: limit,
      skip: skip,
      order: { id: 'DESC' },
    });

    if (!listings) return next(new AppError('No listings found', 400));

    return res
      .status(200)
      .json({ success: true, data: listings[0], totalRecords: listings[1] });
  }
);
module.exports = {
  addListing,
  getAllListings,
  getListingDetails,
  toggleActiveListing,
  updateListing,
  getListingDetailsForUser,
  getAllListingsForHomePage,
  getListingsCount,
  getAllListingsForUser,
  getAllRecommendedListingsForUser
};
