const { EntitySchema } = require('typeorm');

const ContactUs = new EntitySchema({
  name: 'ContactUs',
  tableName: 'contact_us',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    slug: {
      type: String,
      nullable: true,
    },
    name: {
      type: String,
      nullable: true,
    },
    email: {
      type: String,
      nullable: true,
    },
    phoneNumber: {
      type: String,
      nullable: true,
    },
    requirements: {
      type: String,
      nullable: true,
    },
  },
});

module.exports = {ContactUs};
