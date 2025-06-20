/**
 * Form Validation Utilities
 * 
 * Reusable functions for form validation with automatic scrolling and highlighting
 */

/**
 * Scroll to and highlight a form field when validation fails
 * @param {string} fieldId - The ID of the field to scroll to and highlight
 * @param {string} errorMessage - The error message to display
 * @param {Function} setError - Function to set the error state
 */
export const scrollToAndHighlightField = (fieldId, errorMessage, setError) => {
  // Set the error message
  setError(errorMessage);

  // Find the field element
  let element = document.getElementById(fieldId);
  
  // If direct ID not found, try finding by data attribute or class
  if (!element) {
    element = document.querySelector(`[data-field-id="${fieldId}"]`);
  }
  
  // If still not found, try finding by name attribute
  if (!element) {
    element = document.querySelector(`[name="${fieldId}"]`);
  }

  if (element) {
    // Scroll to the element with smooth behavior
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest'
    });

    // Add a highlight effect
    element.classList.add('validation-error-highlight');
    
    // Focus the element if it's focusable
    if (element.focus) {
      setTimeout(() => {
        element.focus();
      }, 300); // Small delay to allow scroll to complete
    }

    // Remove the highlight after 3 seconds
    setTimeout(() => {
      element.classList.remove('validation-error-highlight');
    }, 3000);
  }
};

/**
 * Validate form fields with automatic scrolling to first error
 * @param {Array} validations - Array of validation objects
 * @param {Function} setError - Function to set error state
 * @returns {boolean} - True if all validations pass, false otherwise
 */
export const validateFormWithScrolling = (validations, setError) => {
  for (const validation of validations) {
    const { isValid, fieldId, errorMessage, customCheck } = validation;
    
    // Check if validation fails
    let validationFailed = false;
    
    if (customCheck && typeof customCheck === 'function') {
      validationFailed = !customCheck();
    } else {
      validationFailed = !isValid;
    }
    
    if (validationFailed) {
      scrollToAndHighlightField(fieldId, errorMessage, setError);
      return false;
    }
  }
  
  // All validations passed
  setError("");
  return true;
};

/**
 * Add IDs to form elements for validation targeting
 * @param {string} prefix - Prefix for IDs to avoid conflicts
 */
export const addValidationIds = (prefix = 'form') => {
  // Add IDs to common form elements that might not have them
  const elementsToId = [
    'input[type="text"]',
    'input[type="email"]', 
    'input[type="password"]',
    'input[type="number"]',
    'select',
    'textarea'
  ];

  elementsToId.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      if (!element.id && (element.name || element.placeholder)) {
        const name = element.name || element.placeholder.toLowerCase().replace(/\s+/g, '-');
        element.id = `${prefix}-${name}-${index}`;
      }
    });
  });
};

/**
 * CSS styles for validation highlighting (to be added to global CSS)
 */
export const validationHighlightCSS = `
.validation-error-highlight {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
  animation: validationPulse 0.5s ease-in-out;
}

@keyframes validationPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.1);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
}
`;
