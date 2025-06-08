const { Currency } = require('../models');

// Seed some default currencies
async function seedDefaultCurrencies() {
  try {
    const existingCount = await Currency.count();
    
    if (existingCount === 0) {
      console.log('Seeding default currencies...');
      
      await Currency.bulkCreate([
        {
          name: 'Uzbekistan Som',
          code: '860',
          charCode: 'UZS'
        },
        {
          name: 'United States Dollar',
          code: '840',
          charCode: 'USD'
        },
        {
          name: 'Russian Ruble',
          code: '643',
          charCode: 'RUB'
        }
      ]);
      
      console.log('Default currencies seeded successfully');
    } else {
      console.log('Currencies already exist in the database, verifying them...');
      
      // Verify that the three main currencies exist
      const uzs = await Currency.findOne({ where: { charCode: 'UZS' } });
      const usd = await Currency.findOne({ where: { charCode: 'USD' } });
      const rub = await Currency.findOne({ where: { charCode: 'RUB' } });
      
      // Create any missing currencies
      const toCreate = [];
      
      if (!uzs) {
        console.log('UZS currency missing, adding it');
        toCreate.push({
          name: 'Uzbekistan Som',
          code: '860',
          charCode: 'UZS'
        });
      }
      
      if (!usd) {
        console.log('USD currency missing, adding it');
        toCreate.push({
          name: 'United States Dollar',
          code: '840',
          charCode: 'USD'
        });
      }
      
      if (!rub) {
        console.log('RUB currency missing, adding it');
        toCreate.push({
          name: 'Russian Ruble',
          code: '643',
          charCode: 'RUB'
        });
      }
      
      if (toCreate.length > 0) {
        await Currency.bulkCreate(toCreate);
        console.log(`Added ${toCreate.length} missing currencies`);
      }
    }
    
    // Return all currencies for easier access
    return await Currency.findAll();
  } catch (error) {
    console.error('Error seeding default currencies:', error);
    return [];
  }
}

module.exports = {
  seedDefaultCurrencies
};
