/**
 * Example usage of the form validation utilities
 * 
 * This demonstrates how to use the reusable validation functions
 * in any form throughout the application.
 */

import React, { useState } from 'react';
import { validateFormWithScrolling, scrollToAndHighlightField } from '../utils/formValidationUtils';

export default function ExampleFormWithValidation() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    // Define validation rules
    const validations = [
      {
        isValid: name.trim(),
        fieldId: 'example-name',
        errorMessage: 'Name is required'
      },
      {
        isValid: email.trim() && email.includes('@'),
        fieldId: 'example-email', 
        errorMessage: 'Valid email is required'
      },
      {
        customCheck: () => {
          // Custom validation for phone number (basic check)
          return phone.trim().length >= 10;
        },
        fieldId: 'example-phone',
        errorMessage: 'Phone number must be at least 10 digits'
      },
      {
        isValid: message.trim().length >= 10,
        fieldId: 'example-message',
        errorMessage: 'Message must be at least 10 characters long'
      }
    ];

    // Run validation with automatic scrolling
    const isValid = validateFormWithScrolling(validations, setError);
    
    if (!isValid) {
      return; // Stop execution if validation fails
    }

    // If validation passes, process the form
    alert('Form submitted successfully!');
    console.log({ name, email, phone, message });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Example Form with Validation</h2>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-4 mb-4 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="example-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="example-name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border py-2 px-3 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="example-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="example-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border py-2 px-3 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="example-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="example-phone"
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border py-2 px-3 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="example-message" className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="example-message"
            placeholder="Enter your message (min 10 characters)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border py-2 px-3 rounded-lg h-24"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Submit Form
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">How to use this validation:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Try submitting without filling required fields</li>
          <li>• The form will automatically scroll to the first error</li>
          <li>• Invalid fields will be highlighted with animation</li>
          <li>• Clear error messages guide you to fix issues</li>
        </ul>
      </div>
    </div>
  );
}
