#!/usr/bin/env node
/**
 * This script generates a .env file for the client app based on 
 * the environment variables present during the build process.
 * It ensures that variables like GOOGLE_MAPS_API_KEY get properly
 * converted to VITE_GOOGLE_MAPS_API_KEY.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Map of environment variables to transform
// Format: 'SOURCE_ENV_VAR': 'VITE_DESTINATION_ENV_VAR'
const ENV_MAPPING = {
  'GOOGLE_MAPS_API_KEY': 'VITE_GOOGLE_MAPS_API_KEY',
  // Add other mappings as needed
};

// Start with any existing variables that already have VITE_ prefix
const envVars = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .reduce((vars, key) => {
    vars[key] = process.env[key];
    return vars;
  }, {});

// Add mapped variables
Object.entries(ENV_MAPPING).forEach(([sourceKey, viteKey]) => {
  if (process.env[sourceKey]) {
    envVars[viteKey] = process.env[sourceKey];
    console.log(`✅ Mapped ${sourceKey} to ${viteKey}`);
  } else {
    console.log(`⚠️ Warning: ${sourceKey} not found in environment`);
  }
});

// Generate content for .env file
const envContent = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// Write to .env file
const envFilePath = path.resolve(__dirname, '../.env');
fs.writeFileSync(envFilePath, envContent + '\n');

console.log(`📝 Generated .env file at ${envFilePath}`);
