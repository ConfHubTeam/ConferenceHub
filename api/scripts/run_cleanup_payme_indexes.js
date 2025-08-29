'use strict';

require('dotenv').config();

const path = require('path');
const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

async function run() {
  console.log('🔧 Running cleanup migration for Transaction.paymeTransId duplicates...');
  const qi = sequelize.getQueryInterface();
  const migrationPath = path.join(__dirname, '..', 'migrations', '20250829_cleanup_payme_unique_indexes.js');
  const migration = require(migrationPath);
  try {
    await migration.up(qi, Sequelize);
    console.log('✅ Cleanup migration executed successfully.');
  } catch (err) {
    console.error('❌ Cleanup migration failed:', err);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
      console.log('🔌 Database connection closed.');
    } catch (e) {
      // noop
    }
  }
}

run();
