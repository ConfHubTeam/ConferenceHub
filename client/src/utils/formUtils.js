/**
 * Validate form fields and scroll to the first invalid field
 * 
 * @param {Object} formData - Object containing form field values
 * @param {Object} validationRules - Object with field names as keys and validation rules as values
 * @returns {Object} - { isValid: boolean, errorMessage: string | null }
 */
export const validateForm = (formData, validationRules) => {
  let isValid = true;
  let errorMessage = null;
  let firstInvalidField = null;

  for (const [field, rule] of Object.entries(validationRules)) {
    const value = formData[field];
    
    // Check if field is required and empty
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      isValid = false;
      errorMessage = rule.errorMessage || `${field} is required`;
      firstInvalidField = field;
      break;
    }
    
    // Check min/max for numbers
    if (rule.type === 'number' && value) {
      const numValue = Number(value);
      if (rule.min !== undefined && numValue < rule.min) {
        isValid = false;
        errorMessage = rule.minErrorMessage || `${field} must be at least ${rule.min}`;
        firstInvalidField = field;
        break;
      }
      
      if (rule.max !== undefined && numValue > rule.max) {
        isValid = false;
        errorMessage = rule.maxErrorMessage || `${field} must be at most ${rule.max}`;
        firstInvalidField = field;
        break;
      }
    }
    
    // Check for date validation
    if (rule.type === 'date' && value) {
      if (rule.minDate && new Date(value) < new Date(rule.minDate)) {
        isValid = false;
        errorMessage = rule.minDateErrorMessage || `${field} must be after ${rule.minDate}`;
        firstInvalidField = field;
        break;
      }
      
      if (rule.maxDate && new Date(value) > new Date(rule.maxDate)) {
        isValid = false;
        errorMessage = rule.maxDateErrorMessage || `${field} must be before ${rule.maxDate}`;
        firstInvalidField = field;
        break;
      }
    }
    
    // Check custom validation function
    if (rule.customValidation && value) {
      const customError = rule.customValidation(value);
      if (customError) {
        isValid = false;
        errorMessage = customError;
        firstInvalidField = field;
        break;
      }
    }
    
    // Check regex patterns
    if (rule.pattern && value && !rule.pattern.test(value)) {
      isValid = false;
      errorMessage = rule.patternErrorMessage || `${field} format is invalid`;
      firstInvalidField = field;
      break;
    }
  }

  // Scroll to the first invalid field
  if (firstInvalidField) {
    const element = document.getElementById(firstInvalidField);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  }

  return { isValid, errorMessage };
};

/**
 * Add IDs to form fields based on their name attributes
 * 
 * @param {Event} event - The form event
 */
export const addFormFieldIds = (event) => {
  const form = event.target;
  const elements = form.elements;
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.name && !element.id) {
      element.id = element.name;
    }
  }
};

/**
 * A utility function to geocode addresses into coordinates
 * 
 * @param {string} address - The address to geocode
 * @returns {Object|null} - { lat: number, lng: number } or null if geocoding fails
 */

/**
 * Check password special characters
 * 
 * @param {string} password - The password to check
 * @param {string} allowedSpecialChars - String containing allowed special characters
 * @returns {object} - { isValid: boolean, invalidChars: string, hasRequiredSpecialChar: boolean }
 */
export const checkPasswordSpecialChars = (password, allowedSpecialChars = "@$!%*?&") => {
  // Check if password has at least one valid special character
  const specialCharRegex = new RegExp(`[${allowedSpecialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`);
  const hasRequiredSpecialChar = specialCharRegex.test(password);
  
  // Check if password has any invalid special characters
  // First remove all allowed characters and alphanumeric
  const strippedPassword = password.replace(new RegExp(`[A-Za-z0-9${allowedSpecialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g'), '');
  
  // If there are any characters left, they are invalid special characters
  const isValid = strippedPassword.length === 0 && hasRequiredSpecialChar;
  
  return {
    isValid,
    invalidChars: strippedPassword,
    hasRequiredSpecialChar
  };
};
import { geocodeAddressYandex } from "./yandexMapsUtils";

export async function geocodeAddress(address) {
  try {
    // Use Yandex Maps Geocoding API as the primary geocoding service for better regional coverage
    console.log("Geocoding address with Yandex:", address);
    const yandexResult = await geocodeAddressYandex(address);
    
    if (yandexResult) {
      console.log("Yandex geocoding successful:", yandexResult);
      return yandexResult;
    }
    
    // Fallback to Google Maps only if Yandex fails completely
    console.warn('Yandex geocoding failed, trying Google Maps as fallback...');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key is missing. Cannot fallback to Google geocoding.');
      return null;
    }

    // Encode the address to use in URL
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      console.log("Google Maps fallback geocoding successful:", { lat, lng });
      return { lat, lng };
    } else {
      console.warn('Google Maps geocoding also failed for address:', address, 'Status:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}