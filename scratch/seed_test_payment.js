const { query } = require('./lib/db/postgres');

async function seed() {
  console.log('🚀 Seeding God-Mode Test Payment...');
  try {
    await query('SYSTEM', `
      INSERT INTO payment_requests (tenant_id, plan_id, amount, currency, transaction_id, status) 
      VALUES ('00000000-0000-0000-0000-000000000000', 'pro', 499, 'INR', 'TXN_GOD_MODE_TEST_007', 'PENDING')
    `);
    console.log('✅ Seed Successful: TXN_GOD_MODE_TEST_007 is PENDING');
  } catch (err) {
    console.error('❌ Seed Failed:', err);
  } finally {
    process.exit();
  }
}

seed();
