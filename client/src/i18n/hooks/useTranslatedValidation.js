import { useEnhancedTranslation } from "../../i18n/hooks/useEnhancedTranslation";

/**
 * Translation-aware form validation hook
 * Provides translated validation messages and validation functions
 */
export const useTranslatedValidation = (namespace = "common") => {
  const { translate } = useEnhancedTranslation(namespace);

  // Validation functions with translated error messages
  const validators = {
    required: (value) => {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return translate("forms.validation.required", {}, "This field is required");
      }
      return null;
    },

    email: (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return translate("forms.validation.email", {}, "Please enter a valid email address");
      }
      return null;
    },

    password: (value, minLength = 8) => {
      if (!value) return null;
      if (value.length < minLength) {
        return translate("forms.validation.password", { min: minLength }, `Password must be at least ${minLength} characters long`);
      }
      return null;
    },

    strongPassword: (value) => {
      if (!value) return null;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
        return translate("forms.validation.strongPassword", {}, "Password must contain uppercase, lowercase, number and special character");
      }
      return null;
    },

    passwordMatch: (password, confirmPassword) => {
      if (!confirmPassword) return null;
      if (password !== confirmPassword) {
        return translate("forms.validation.passwordMatch", {}, "Passwords do not match");
      }
      return null;
    },

    phone: (value) => {
      if (!value) return null;
      // Basic international phone validation
      const phoneRegex = /^[+]?[\d\s\-()]{8,}$/;
      if (!phoneRegex.test(value)) {
        return translate("forms.validation.phone", {}, "Please enter a valid phone number");
      }
      return null;
    },

    minLength: (value, min) => {
      if (!value) return null;
      if (value.length < min) {
        return translate("forms.validation.minLength", { min }, `Must be at least ${min} characters`);
      }
      return null;
    },

    maxLength: (value, max) => {
      if (!value) return null;
      if (value.length > max) {
        return translate("forms.validation.maxLength", { max }, `Must be no more than ${max} characters`);
      }
      return null;
    },

    numeric: (value) => {
      if (!value) return null;
      if (isNaN(value) || isNaN(parseFloat(value))) {
        return translate("forms.validation.numeric", {}, "Must be a valid number");
      }
      return null;
    },

    positive: (value) => {
      if (!value) return null;
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return translate("forms.validation.positive", {}, "Must be a positive number");
      }
      return null;
    },

    integer: (value) => {
      if (!value) return null;
      if (!Number.isInteger(Number(value))) {
        return translate("forms.validation.integer", {}, "Must be a whole number");
      }
      return null;
    },

    alphanumeric: (value) => {
      if (!value) return null;
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      if (!alphanumericRegex.test(value)) {
        return translate("forms.validation.alphanumeric", {}, "Only letters and numbers are allowed");
      }
      return null;
    },

    noSpecialChars: (value) => {
      if (!value) return null;
      const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/;
      if (specialCharsRegex.test(value)) {
        return translate("forms.validation.noSpecialChars", {}, "Special characters are not allowed");
      }
      return null;
    },

    futureDate: (value) => {
      if (!value) return null;
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (inputDate <= today) {
        return translate("forms.validation.futureDate", {}, "Date must be in the future");
      }
      return null;
    },

    pastDate: (value) => {
      if (!value) return null;
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (inputDate >= today) {
        return translate("forms.validation.pastDate", {}, "Date must be in the past");
      }
      return null;
    },

    validDate: (value) => {
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return translate("forms.validation.validDate", {}, "Please enter a valid date");
      }
      return null;
    },

    fileSize: (file, maxSizeMB) => {
      if (!file) return null;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return translate("forms.validation.fileSize", { size: maxSizeMB }, `File size must be less than ${maxSizeMB}MB`);
      }
      return null;
    },

    fileType: (file, allowedTypes) => {
      if (!file) return null;
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        return translate("forms.validation.fileType", { types: allowedTypes.join(', ') }, `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      }
      return null;
    }
  };

  // Validate a single field with multiple validators
  const validateField = (value, validationRules = []) => {
    for (const rule of validationRules) {
      const error = rule(value);
      if (error) {
        return error;
      }
    }
    return null;
  };

  // Validate entire form
  const validateForm = (values, validationSchema) => {
    const errors = {};
    
    Object.keys(validationSchema).forEach(fieldName => {
      const rules = validationSchema[fieldName];
      const error = validateField(values[fieldName], rules);
      if (error) {
        errors[fieldName] = error;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  return {
    validators,
    validateField,
    validateForm,
    translate
  };
};

export default useTranslatedValidation;
