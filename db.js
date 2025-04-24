require('reflect-metadata');
const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config();


const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://neondb_owner:npg_cMD8bStlf6pu@ep-gentle-shadow-a15j2ham-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=requires', // Use Neon Database URL
  entities: ['models/*{.ts,.js}'],
  synchronize: true, // Change to false in production
  ssl: {
    rejectUnauthorized: false, // Required for Neon SSL connection
  },
});

module.exports = { AppDataSource };
