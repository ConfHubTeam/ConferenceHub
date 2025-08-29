'use strict';

/**
 * Cleanup migration: remove duplicate unique constraints and indexes on Transaction.paymeTransId
 * and ensure a single canonical partial unique index exists for provider='payme'.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const qi = queryInterface;
    const sequelize = qi.sequelize;

    // 1) Drop duplicate unique constraints on paymeTransId
    const dropConstraintsSql = `
      DO $$
      DECLARE
        con RECORD;
      BEGIN
        FOR con IN (
          SELECT conname
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = 'public'
            AND t.relname = 'Transaction'
            AND c.contype = 'u'
            AND pg_get_constraintdef(c.oid) ILIKE '%paymeTransId%'
        ) LOOP
          EXECUTE format('ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS %I', con.conname);
        END LOOP;
      END $$;
    `;

    // 2) Drop any remaining indexes on paymeTransId (that are not tied to constraints)
    const dropIndexesSql = `
      DO $$
      DECLARE
        idx RECORD;
      BEGIN
        FOR idx IN (
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'Transaction'
            AND indexdef ILIKE '%paymeTransId%'
        ) LOOP
          EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
        END LOOP;
      END $$;
    `;

    // 3) Recreate the single canonical partial unique index
    const createCanonicalIndexSql = `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_payme_trans_unique
      ON "Transaction" ("paymeTransId")
      WHERE provider = 'payme';
    `;

    await sequelize.query(dropConstraintsSql);
    await sequelize.query(dropIndexesSql);
    await sequelize.query(createCanonicalIndexSql);
  },

  down: async (queryInterface, Sequelize) => {
    const qi = queryInterface;
    const sequelize = qi.sequelize;
    // Best-effort revert: drop the canonical index (does not recreate duplicates)
    await sequelize.query(`
      DROP INDEX IF EXISTS idx_transaction_payme_trans_unique;
    `);
  }
};
