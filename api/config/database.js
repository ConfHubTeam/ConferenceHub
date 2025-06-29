const { Sequelize } = require('sequelize');
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
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Render PostgreSQL service
      }
    },
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
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
      logging: console.log,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;
/**
 * PAY
 */
const pay = async (req, res) => {
    try {
        const { method, params, id } = req.body;

        switch (method) {
            case PaymeMethod.CheckPerformTransaction: {
                await transactionService.checkPerformTransaction(params, id);
                return res.json({ result: { allow: true } });
            }
            case PaymeMethod.CheckTransaction: {
                const result = await transactionService.checkTransaction(params, id);
                return res.json({ result, id });
            }
            case PaymeMethod.CreateTransaction: {
                const result = await transactionService.createTransaction(params, id);
                return res.json({ result, id });
            }
            case PaymeMethod.PerformTransaction: {
                const result = await transactionService.performTransaction(params, id);
                return res.json({ result, id });
            }
            case PaymeMethod.CancelTransaction: {
                const result = await transactionService.cancelTransaction(params, id);
                return res.json({ result, id });
            }
            case PaymeMethod.GetStatement: {
                const result = await transactionService.getStatement(params, id);
                return res.json({ result: { transactions: result } });
            }
        }
    } catch (error) {
        const statusCode = error.statusCode || 422;
        const response = { error: error.message };

        res.status(statusCode).json(response);
    }
};
