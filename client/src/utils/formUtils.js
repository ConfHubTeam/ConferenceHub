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