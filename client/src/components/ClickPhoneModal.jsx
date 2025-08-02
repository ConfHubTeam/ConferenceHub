import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import CustomPhoneInput, { isValidPhoneNumber } from "./CustomPhoneInput";

/**
 * Click Phone Number Modal Component
 * Shows current user phone and allows editing for Click payment verification
 * Does NOT update the user's account phone number
 */
const ClickPhoneModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  onPaymentSuccess, 
  onPaymentError 
}) => {
  const { t } = useTranslation(["payment", "common"]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [profilePhone, setProfilePhone] = useState(""); // Profile phone number for reference
  const [hasClickPhone, setHasClickPhone] = useState(false); // Whether user has saved Click phone
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingUserPhone, setIsLoadingUserPhone] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user's current phone number when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserPhone();
    }
  }, [isOpen]);

  const fetchUserPhone = async () => {
    setIsLoadingUserPhone(true);
    try {
      const response = await api.get("/click/user-phone");
      if (response.data.success && response.data.phoneNumber) {
        const { phoneNumber, clickPhoneNumber, profilePhoneNumber, hasClickPhone, isUsingProfilePhone } = response.data;
        
        setOriginalPhone(phoneNumber);
        setPhoneNumber(phoneNumber);
        setProfilePhone(profilePhoneNumber || "");
        setHasClickPhone(hasClickPhone);
        
        // Only show editing mode if no phone number at all
        setIsEditing(!phoneNumber);
      } else {
        // No phone number available, user needs to enter one
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error fetching user phone:", error);
      setError(t("payment:clickPhoneModal.errors.loadFailed"));
      setIsEditing(true);
    } finally {
      setIsLoadingUserPhone(false);
    }
  };

  const handlePhoneChange = (value) => {
    setPhoneNumber(value || "");
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) {
      return t("payment:clickPhoneModal.errors.phoneRequired");
    }
    
    if (!isValidPhoneNumber(phone)) {
      return t("payment:clickPhoneModal.errors.phoneInvalid");
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validatePhoneNumber(phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Create the payment invoice
      const response = await api.post("/click/checkout", {
        bookingId: booking.id,
        clickPhoneNumber: phoneNumber // Send the phone number (either original or edited)
      });

      if (response.data.success) {
        // Close modal and redirect to Click auth page
        onClose();
        
        // Redirect to Click auth page so user can authenticate and see their invoice
        // This works for both desktop (web auth) and mobile (app option if installed)
        window.open("https://my.click.uz/auth", "_blank", "noopener,noreferrer");
        
        onPaymentSuccess?.(response.data);
      } else {
        throw new Error(response.data.message || "Failed to create payment");
      }

    } catch (error) {
      console.error("Payment creation error:", error);
      
      let errorMessage = t("payment:clickPhoneModal.errors.paymentFailed");
      
      if (error.response?.data) {
        const { error: responseError, details } = error.response.data;
        errorMessage = details || responseError || errorMessage;
      }
      
      setError(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setPhoneNumber(originalPhone);
    setIsEditing(false);
    setError("");
  };

  const handleRegisterClick = () => {
    window.open("https://my.click.uz/registration", "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {t("payment:clickPhoneModal.title", "Click Payment")}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isProcessing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {isLoadingUserPhone ? (
            <div className="mb-4 flex items-center justify-center py-8">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">{t("payment:clickPhoneModal.loadingPhone")}</span>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                {originalPhone 
                  ? hasClickPhone 
                    ? t("payment:clickPhoneModal.verifyClickDescription")
                    : t("payment:clickPhoneModal.verifyProfileDescription")
                  : t("payment:clickPhoneModal.enterDescription")
                }
              </p>
              
              <label htmlFor="clickPhone" className="block text-sm font-medium text-gray-700 mb-2">
                {t("payment:clickPhoneModal.phoneLabel", "Click Account Phone Number")}
              </label>
              
              {!isEditing && originalPhone ? (
                // Display mode - show phone with edit button
                <div className="flex items-center space-x-3">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    <span className="text-gray-900">{phoneNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-300 rounded-md transition-colors"
                    disabled={isProcessing}
                  >
                    {t("payment:clickPhoneModal.editButton")}
                  </button>
                </div>
              ) : (
                // Edit mode - show input field
                <div>
                  <CustomPhoneInput
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="+998 XX XXX XX XX"
                    defaultCountry="UZ"
                    disabled={isProcessing}
                    required
                    error={error}
                  />
                  
                  {isEditing && originalPhone && (
                    <div className="mt-2 flex space-x-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-sm text-gray-600 hover:text-gray-800"
                        disabled={isProcessing}
                      >
                        {t("payment:clickPhoneModal.cancelEditing")}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
            </div>
          )}

          {/* Amount Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {t("payment:clickPhoneModal.paymentAmount", "Payment Amount:")}
              </span>
              <span className="font-medium text-gray-900">
                {(booking.finalTotal || booking.totalPrice)?.toLocaleString()} UZS
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isProcessing || isLoadingUserPhone}
            >
              {t("common:cancel", "Cancel")}
            </button>
            
            <button
              type="submit"
              disabled={isProcessing || isLoadingUserPhone || !phoneNumber}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                isProcessing || isLoadingUserPhone || !phoneNumber
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("payment:clickPhoneModal.processing", "Processing...")}
                </div>
              ) : (
                t("payment:clickPhoneModal.payButton", "Pay with Click")
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {t("payment:clickPhoneModal.noAccount", "Don't have a Click account?")}
            </p>
            <button
              type="button"
              onClick={handleRegisterClick}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {t("payment:clickPhoneModal.registerLink", "Register here")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClickPhoneModal;
