/**
 * Migration: Add Click Merchant API fields to bookings table
 * Adds fields for tracking Click.uz invoice information and payment status
 */

exports.up = async (pgm) => {
  // Add Click.uz invoice tracking fields
  pgm.addColumns('bookings', {
    click_invoice_id: {
      type: 'varchar(255)',
      notNull: false,
      comment: 'Click.uz invoice ID from Merchant API'
    },
    click_invoice_created_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'When the Click.uz invoice was created'
    },
    click_payment_id: {
      type: 'varchar(255)',
      notNull: false,
      comment: 'Click.uz payment ID when payment is completed'
    },
    paid_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'When the payment was successfully completed'
    }
  });

  // Add index for faster lookup by invoice ID
  pgm.createIndex('bookings', ['click_invoice_id'], {
    name: 'idx_bookings_click_invoice_id',
    unique: false
  });

  // Add index for faster lookup by payment ID
  pgm.createIndex('bookings', ['click_payment_id'], {
    name: 'idx_bookings_click_payment_id',
    unique: false
  });
};

exports.down = async (pgm) => {
  // Drop indexes first
  pgm.dropIndex('bookings', ['click_payment_id'], {
    name: 'idx_bookings_click_payment_id'
  });
  
  pgm.dropIndex('bookings', ['click_invoice_id'], {
    name: 'idx_bookings_click_invoice_id'
  });

  // Drop columns
  pgm.dropColumns('bookings', [
    'click_invoice_id',
    'click_invoice_created_at', 
    'click_payment_id',
    'paid_at'
  ]);
};
