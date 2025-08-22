/**
 * Migration: Convert perks column from ARRAY to JSONB
 * This migration converts the perks column from PostgreSQL ARRAY(STRING) to JSONB
 * to support the new paid/free perks structure while maintaining backward compatibility
 */

exports.up = async (pgm) => {
  // First, create a temporary column to store the converted data
  pgm.addColumn('Places', {
    perks_temp: {
      type: 'jsonb',
      notNull: false,
      default: '[]'
    }
  });

  // Convert existing array data to JSONB format
  // Transform array of strings to array of objects with {name: string, isPaid: false}
  pgm.sql(`
    UPDATE "Places" 
    SET perks_temp = (
      SELECT COALESCE(
        json_agg(
          json_build_object('name', perk_name, 'isPaid', false)
        ), 
        '[]'::json
      )::jsonb
      FROM unnest(perks) AS perk_name
    )
    WHERE perks IS NOT NULL AND array_length(perks, 1) > 0;
  `);

  // Set empty arrays for null or empty perks
  pgm.sql(`
    UPDATE "Places" 
    SET perks_temp = '[]'::jsonb
    WHERE perks IS NULL OR array_length(perks, 1) IS NULL;
  `);

  // Drop the old column
  pgm.dropColumn('Places', 'perks');

  // Rename the temporary column to the original name
  pgm.renameColumn('Places', 'perks_temp', 'perks');

  // Add a constraint to ensure perks is not null
  pgm.alterColumn('Places', 'perks', {
    notNull: true,
    default: '[]'
  });
};

exports.down = async (pgm) => {
  // Create a temporary column with the old ARRAY type
  pgm.addColumn('Places', {
    perks_temp: {
      type: 'varchar[]',
      notNull: false,
      default: pgm.func('ARRAY[]::varchar[]')
    }
  });

  // Convert JSONB back to array of strings
  // Extract the 'name' field from each object in the JSONB array
  pgm.sql(`
    UPDATE "Places" 
    SET perks_temp = (
      SELECT COALESCE(
        array_agg(perk->>'name'), 
        ARRAY[]::varchar[]
      )
      FROM jsonb_array_elements(perks) AS perk
    )
    WHERE perks IS NOT NULL AND jsonb_array_length(perks) > 0;
  `);

  // Set empty arrays for null or empty perks
  pgm.sql(`
    UPDATE "Places" 
    SET perks_temp = ARRAY[]::varchar[]
    WHERE perks IS NULL OR jsonb_array_length(perks) = 0;
  `);

  // Drop the JSONB column
  pgm.dropColumn('Places', 'perks');

  // Rename the temporary column back
  pgm.renameColumn('Places', 'perks_temp', 'perks');

  // Set default value for the reverted column
  pgm.alterColumn('Places', 'perks', {
    notNull: false,
    default: pgm.func('ARRAY[]::varchar[]')
  });
};
