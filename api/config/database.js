const { Sequelize } = require('sequelize');
const optimizationConfig = require('./databaseOptimization');
require('dotenv').config();

// Function to parse database URL (useful for Render's EXTERNAL_URL format)
const parseDatabaseUrl = (url) => {
  if (!url) return null;
  
  const regex = /^postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(regex);
  
  if (!match) return null;
  
  return {
    username: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5]
  };
};

// Create Sequelize instance with connection options
let sequelize;

// Check if we have a DB_URL (provided by Render)
if (process.env.DB_URL) {
  sequelize = new Sequelize(process.env.DB_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ...optimizationConfig.sequelize.dialectOptions,
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Render PostgreSQL service
      }
    },
    logging: optimizationConfig.sequelize.logging,
    pool: optimizationConfig.sequelize.pool,
    retry: optimizationConfig.sequelize.retry
  });
} else {
  // Use individual connection parameters (local development)
  sequelize = new Sequelize(
    process.env.POSTGRES_DB || 'conferencehub', 
    process.env.POSTGRES_USER || 'postgres',
    process.env.POSTGRES_PASSWORD || 'postgres',
    {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      dialect: 'postgres',
      logging: optimizationConfig.sequelize.logging,
      pool: optimizationConfig.sequelize.pool,
      retry: optimizationConfig.sequelize.retry,
      dialectOptions: optimizationConfig.sequelize.dialectOptions
    }
  );
}

module.exports = sequelize;