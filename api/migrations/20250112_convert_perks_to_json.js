const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Converting perks column from ARRAY to JSON...');
    
    // Step 1: Create a temporary column with JSON type
    await queryInterface.addColumn('Places', 'perks_temp', {
      type: DataTypes.JSON,
      allowNull: true
    });
    
    // Step 2: Migrate data from array to JSON format
    // We need to convert array of strings to array of objects with { name, isPaid }
    await queryInterface.sequelize.query(`
      UPDATE "Places" 
      SET "perks_temp" = CASE 
        WHEN "perks" IS NULL OR array_length("perks", 1) IS NULL THEN '[]'::json
        ELSE (
          SELECT json_agg(
            json_build_object(
              'name', perk_name,
              'isPaid', false
            )
          )
          FROM unnest("perks") AS perk_name
        )
      END
    `);
    
    // Step 3: Drop the old perks column
    await queryInterface.removeColumn('Places', 'perks');
    
    // Step 4: Rename temp column to perks
    await queryInterface.renameColumn('Places', 'perks_temp', 'perks');
    
    // Step 5: Set column to NOT NULL with default value
    await queryInterface.changeColumn('Places', 'perks', {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    });
    
    console.log('Successfully converted perks column to JSON format');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Reverting perks column from JSON to ARRAY...');
    
    // Step 1: Create a temporary column with ARRAY type
    await queryInterface.addColumn('Places', 'perks_temp', {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    });
    
    // Step 2: Migrate data from JSON back to array format
    await queryInterface.sequelize.query(`
      UPDATE "Places" 
      SET "perks_temp" = CASE 
        WHEN "perks" IS NULL OR "perks"::text = '[]' THEN ARRAY[]::text[]
        ELSE (
          SELECT array_agg(perk->>'name')
          FROM json_array_elements("perks"::json) AS perk
        )
      END
    `);
    
    // Step 3: Drop the JSON perks column
    await queryInterface.removeColumn('Places', 'perks');
    
    // Step 4: Rename temp column to perks
    await queryInterface.renameColumn('Places', 'perks_temp', 'perks');
    
    // Step 5: Set column to NOT NULL with default value
    await queryInterface.changeColumn('Places', 'perks', {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    });
    
    console.log('Successfully reverted perks column to ARRAY format');
  }
};
