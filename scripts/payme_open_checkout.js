#!/usr/bin/env node
/*
 * Payme Checkout URL generator/opener
 * Usage examples:
 *   node scripts/payme_open_checkout.js --order 69 --amount 100000 --open
 *   node scripts/payme_open_checkout.js --order 69 --uzs 1000 --open
 * Options:
 *   --order <id>       booking/order id to send as account[order_id]
 *   --amount <tiyin>   amount in tiyin (e.g., 100000)
 *   --uzs <uzs>        amount in UZS (will be converted to tiyin)
 *   --callback <url>   optional return url (adds c=<url>)
 *   --sandbox          use https://checkout.test.paycom.uz base URL
 *   --prod             force production base URL https://checkout.paycom.uz
 *   --open             open the URL in default browser (macOS)
 */
const { spawnSync } = require('child_process');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true; // boolean flag
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const merchantId = process.env.PAYME_MERCHANT_ID;
if (!merchantId) {
  console.error('PAYME_MERCHANT_ID is missing from .env');
  process.exit(1);
}

const orderId = args.order || args.order_id;
if (!orderId) {
  console.error('--order <id> is required');
  process.exit(1);
}

let amountTiyin;
if (args.amount) {
  amountTiyin = parseInt(args.amount, 10);
} else if (args.uzs) {
  const uzs = parseFloat(String(args.uzs).replace(/,/g, ''));
  amountTiyin = Math.round(uzs * 100);
}
if (!Number.isFinite(amountTiyin) || amountTiyin <= 0) {
  console.error('Provide a valid --amount (tiyin) or --uzs (UZS)');
  process.exit(1);
}

const parts = [
  `m=${merchantId}`,
  `ac.order_id=${orderId}`,
  `a=${amountTiyin}`,
];
if (args.callback) {
  parts.push(`c=${args.callback}`);
}

const raw = parts.join(';');
const encoded = Buffer.from(raw).toString('base64');

const isSandbox = !!args.sandbox || (process.env.NODE_ENV !== 'production' && !args.prod);
const baseUrl = isSandbox ? 'https://checkout.test.paycom.uz' : 'https://checkout.paycom.uz';
const url = `${baseUrl}/${encoded}`;

console.log('Payme checkout URL:');
console.log(url);
console.log('\nPayload:', raw);

// Also print a minimal HTML form snippet for manual testing
console.log('\nOptional HTML form snippet:');
console.log(`<form method="POST" action="${baseUrl}/">\n  <input type="hidden" name="merchant" value="${merchantId}">\n  <input type="hidden" name="account[order_id]" value="${orderId}">\n  <input type="hidden" name="amount" value="${amountTiyin}">\n  <input type="hidden" name="lang" value="ru">\n  ${args.callback ? `<input type=\"hidden\" name=\"callback\" value=\"${args.callback}\">` : ''}\n  <button type="submit">Pay with Payme</button>\n</form>`);

if (args.open) {
  // macOS: open default browser
  const r = spawnSync('open', [url], { stdio: 'inherit' });
  if (r.error) {
    console.error('Failed to open browser:', r.error.message);
  }
}
