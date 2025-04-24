const { EntitySchema } = require('typeorm');

const Status = {
  ACTIVE: 'Active',
  DEACTIVE: 'Deactive',
};

const Origin = {
  JAPAN: 'Japan',
  THAILAND: 'Thailand',
  DUBAI: 'Dubai',
};

const Listing = new EntitySchema({
  name: 'Listing',
  tableName: 'listings', // You can customize the table name if needed
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    location: {
      type: String,
    },
    city: {
      type: String,
    },
    offerNo: {
      type: String,
    },
    chassisNo: {
      type: String,
    },
    carStatus: {
      type: String,
    },
    make: {
      type: String,
    },
    model: {
      type: String,
    },
    grade: {
      type: String,
    },
    modelYear: {
      type: Number,
    },
    manufactured: {
      type: String,
    },
    firstRegistrationDate: {
      type: String,
    },
    engineSize: {
      type: String,
    },
    mileage: {
      type: Number,
    },
    seats: {
      type: Number,
    },
    driveType: {
      type: String,
    },
    bodyType: {
      type: String,
    },
    steering: {
      type: String,
    },
    transmission: {
      type: String,
    },
    color: {
      type: String,
    },
    price: {
      type: Number,
    },
    fuelType: {
      type: String,
    },
    name: {
      type: String,
    },
    slug: {
      type: String,
      nullable: true,
      default: null,
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.ACTIVE,
    },
    photos: {
      type: 'text',
      array: true,
    },
    From: {
      type: 'enum',
      enum: Origin,
      default: Origin.JAPAN,
    },
  },
});

module.exports = {
  Listing,
  Status,
  Origin,
};
