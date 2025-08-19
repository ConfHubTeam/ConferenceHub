/**
 * Real-time monitoring script for Payme integration testing
 * Run this while testing with Payme portal to see live updates
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'conferencehub',
  port: process.env.DB_PORT || 5432,
});

let lastTransactionCount = 0;

async function checkForNewTransactions() {
  try {
    // Get latest transactions
    const result = await pool.query(`
      SELECT 
        t.id,
        t."bookingId",
        t."paymeTransId",
        t.state,
        t.amount,
        t."createDate",
        b.status as booking_status
      FROM "Transaction" t
      LEFT JOIN "Bookings" b ON t."bookingId" = b.id
      ORDER BY t.id DESC 
      LIMIT 5
    `);

    const currentCount = result.rows.length;
    const latestTransactions = result.rows;

    // Clear screen and show header
    console.clear();
    console.log('🔍 Payme Integration - Live Monitoring');
    console.log('=====================================');
    console.log(`⏰ ${new Date().toLocaleTimeString()}`);
    console.log(`📊 Total Transactions: ${currentCount}`);
    console.log('');

    // Show recent transactions
    console.log('🔄 Recent Transactions:');
    console.log('┌─────┬──────────┬─────────────────────────┬───────┬────────┬─────────────────┐');
    console.log('│ ID  │ Booking  │ Payme Trans ID          │ State │ Amount │ Booking Status  │');
    console.log('├─────┼──────────┼─────────────────────────┼───────┼────────┼─────────────────┤');
    
    latestTransactions.forEach(tx => {
      const stateEmoji = getStateEmoji(tx.state);
      const stateText = getStateText(tx.state);
      console.log(`│ ${String(tx.id).padEnd(3)} │ ${String(tx.bookingId).padEnd(8)} │ ${(tx.paymeTransId || 'null').padEnd(23)} │ ${stateEmoji} ${String(tx.state).padEnd(2)} │ ${String(tx.amount).padEnd(6)} │ ${String(tx.booking_status || 'unknown').padEnd(15)} │`);
    });
    
    console.log('└─────┴──────────┴─────────────────────────┴───────┴────────┴─────────────────┘');

    // Show state legend
    console.log('\n📋 Transaction States:');
    console.log('   1 = 🟡 Pending    | 2 = 🟢 Paid     | -1 = 🔴 Cancelled | -2 = 🟠 Cancelled After Pay');

    // Show available test bookings
    console.log('\n💡 Available Test Bookings:');
    console.log('   ID 42: 5,000 UZS (500,000 tiyin) | ID 41: 2,000 UZS (200,000 tiyin)');
    console.log('   ID 40: 9,000 UZS (900,000 tiyin) | ID 38: 1,000 UZS (100,000 tiyin)');

    console.log('\n🌐 Webhook URL: https://arguably-sunny-garfish.ngrok-free.app/api/payme/pay');
    console.log('📝 Press Ctrl+C to stop monitoring...\n');

  } catch (error) {
    console.error('❌ Error monitoring transactions:', error.message);
  }
}

function getStateEmoji(state) {
  switch (state) {
    case 1: return '🟡';   // Pending
    case 2: return '🟢';   // Paid
    case -1: return '🔴';  // Cancelled
    case -2: return '🟠';  // Cancelled after payment
    default: return '⚪';
  }
}

function getStateText(state) {
  switch (state) {
    case 1: return 'Pending';
    case 2: return 'Paid';
    case -1: return 'Cancelled';
    case -2: return 'Cancelled After Pay';
    default: return 'Unknown';
  }
}

console.log('🚀 Starting Payme transaction monitoring...');
console.log('💡 Test your integration in Payme portal now!\n');

// Update every 2 seconds
setInterval(checkForNewTransactions, 2000);

// Initial check
checkForNewTransactions();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping monitoring... Good luck with your Payme integration!');
  pool.end();
  process.exit(0);
});
