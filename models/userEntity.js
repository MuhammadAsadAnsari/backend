const { EntitySchema } = require('typeorm');

// Role enum in plain JavaScript
const Role = {
  ADMIN: 'admin',
  USER: 'user',
};

// Define the User entity using EntitySchema
const User = new EntitySchema({
  name: 'User',
  tableName: 'user',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    name: {
      type: String,
      nullable: true,
    },
    email: {
      type: String,
      nullable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    photo: {
      type: String,
      default: 'default.png',
    },
    role: {
      type: 'enum',
      enum: Role,
      default: Role.USER,
    },
    password: {
      type: String,
      select: false,
    },
    passwordResetCode: {
      type: String,
      default: null,
    },
  },
});

module.exports = {
  User,
  Role,
};
