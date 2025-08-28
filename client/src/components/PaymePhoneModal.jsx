import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import CustomPhoneInput, { isValidPhoneNumber } from "./CustomPhoneInput";

/**
 * Payme Phone Number Modal Component
 * Shows current user phone and allows editing for Payme payment verification
 * Matches the ClickPhoneModal styling and functionality
 */
const PaymePhoneModal = ({
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
  const [hasPaymePhone, setHasPaymePhone] = useState(false); // Whether user has saved Payme phone
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
      // Try to get Payme-specific phone first, fallback to user profile
      try {
        const response = await api.get("/payme/user-phone");
        if (response.data.success && response.data.phoneNumber) {
          const { phoneNumber, paymePhoneNumber, profilePhoneNumber, hasPaymePhone } = response.data;

          setOriginalPhone(phoneNumber);
          setPhoneNumber(phoneNumber);
          setProfilePhone(profilePhoneNumber || "");
          setHasPaymePhone(hasPaymePhone);

          // Only show editing mode if no phone number at all
          setIsEditing(!phoneNumber);
        } else {
          throw new Error("No phone number found");
        }
      } catch (paymeError) {
        // Fallback to profile endpoint if Payme endpoint doesn't exist yet
        const profileResponse = await api.get("/profile");
        const userPhone = profileResponse.data.phoneNumber || "";
        setOriginalPhone(userPhone);
        setPhoneNumber(userPhone);
        setProfilePhone(userPhone);
        setHasPaymePhone(false);
        setIsEditing(!userPhone);
      }
    } catch (error) {
      console.error("Error fetching user phone:", error);
      setError(t("payment:errors.failedToLoadPhone", "Failed to load phone number"));
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
      return t("payment:errors.phoneRequired", "Phone number is required");
    }

    if (!isValidPhoneNumber(phone)) {
      return t("payment:errors.invalidPhone", "Please enter a valid phone number");
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
      await createPayment();
    } catch (error) {
      console.error("Payme payment creation failed:", error);
      const errorMessage = error.response?.data?.error || error.message || "Payment initialization failed";
      setError(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const createPayment = async () => {
    try {
      // Save phone number to user profile in background (non-blocking)
      if (phoneNumber !== originalPhone) {
        api.patch("/payme/update-phone", {
          phoneNumber: phoneNumber
        }).catch(error => {
          // Don't block payment flow for this
        });
      }

      // Create a form and submit it to Payme using POST method
      // This is the correct way according to Payme documentation

      let MERCHANT_ID = import.meta.env.VITE_PAYME_MERCHANT_ID;

      // If merchant ID is not in environment, try to get it from backend
      if (!MERCHANT_ID) {
        try {
          const configResponse = await api.get("/payme/config");
          MERCHANT_ID = configResponse.data.merchantId;
        } catch (configError) {
          // Configuration error handled below
        }
      }

      if (!MERCHANT_ID) {
        throw new Error("Payme merchant ID not configured");
      }

      // Calculate amount in tiyin (multiply by 100)
      const amount = Math.round((booking.finalTotal || booking.totalPrice) * 100);

      // Get the correct URL from backend configuration
      const configResponse = await api.get("/payme/config");
      const checkoutUrl = configResponse.data.checkoutUrl || 'https://checkout.paycom.uz';

      // Create form element
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = checkoutUrl; // Use environment-aware URL from backend
      form.target = '_blank'; // Open in new tab

      // Add form fields according to Payme documentation
      const fields = {
        merchant: MERCHANT_ID,
        amount: amount,
        'account[order_id]': String(booking.id), // Use booking ID as order_id
        'account[user_id]': String(booking.userId || 'guest'),
        'account[phone]': phoneNumber, // Include phone number in account object
        lang: 'ru',
        callback: `${window.location.origin}/bookings?transaction=:transaction`,
        callback_timeout: 15000,
        // Display both booking reference and numeric order id
        description: `Booking: #${booking.uniqueRequestId}, - ${booking.place?.title}`, // Use English to avoid encoding issues
      };

      // Add detail object for receipt (optional but recommended)
      const detail = {
        receipt_type: 0, // Sale
        items: [
          {
            title: `Bronirovaniye nedvizhimosti #${booking.id}`, // Use Latin text to avoid encoding issues
            price: amount,
            count: 1,
            code: "10611003001000000", // Generic accommodation service IKPU code
            units: 796, // Service unit code
            vat_percent: 0,
            package_code: "137001"
          }
        ]
      };

      // Encode detail object to base64 using UTF-8 safe method
      const detailJson = JSON.stringify(detail);
      const detailBase64 = btoa(unescape(encodeURIComponent(detailJson)));
      fields.detail = detailBase64;

      // Create hidden input fields
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      // Add form to page and submit
      document.body.appendChild(form);

      form.submit();

      // Remove form after submission
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
      }, 1000);

      // Close modal and notify parent
      onClose();
      onPaymentSuccess?.({
        provider: 'payme',
        amount: booking.finalTotal || booking.totalPrice,
        phoneNumber: phoneNumber,
        bookingId: booking.id,
        orderId: String(booking.id) // Use booking ID as order ID
      });

    } catch (error) {
      console.error("Failed to create Payme payment:", error);
      throw error;
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
    window.open("https://payme.uz/", "_blank", "noopener,noreferrer");
  };

  const handleClose = () => {
    // Reset all state when closing modal
    setPhoneNumber("");
    setOriginalPhone("");
    setProfilePhone("");
    setHasPaymePhone(false);
    setIsEditing(false);
    setError("");
    setIsProcessing(false);
    setIsLoadingUserPhone(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {t("payment:payme.title", "Payme Payment")}
            </h3>
            <button
              onClick={handleClose}
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
              <span className="ml-2 text-gray-600">{t("payment:payme.loadingPhone", "Loading phone number...")}</span>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                {originalPhone
                  ? hasPaymePhone
                    ? t("payment:payme.verifyPaymeDescription", "Your Payme phone number will be used for payment verification.")
                    : t("payment:payme.verifyProfileDescription", "Your profile phone number will be used for Payme payment.")
                  : t("payment:payme.enterDescription", "Please enter your phone number registered with Payme.")
                }
              </p>

              <label htmlFor="paymePhone" className="block text-sm font-medium text-gray-700 mb-2">
                {t("payment:payme.phoneLabel", "Payme Account Phone Number")}
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
                    {t("payment:payme.editButton", "Edit")}
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
                        {t("payment:payme.cancelEditing", "Cancel editing")}
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
                {t("payment:payme.paymentAmount", "Payment Amount:")}
              </span>
              <span className="font-medium text-gray-900">
                {(booking.finalTotal || booking.totalPrice)?.toLocaleString()} UZS
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isProcessing || isLoadingUserPhone}
            >
              {t("common:cancel", "Cancel")}
            </button>

            <button
              type="submit"
              disabled={isProcessing || isLoadingUserPhone || !phoneNumber}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${isProcessing || isLoadingUserPhone || !phoneNumber
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
                  {t("payment:payme.processing", "Processing...")}
                </div>
              ) : (
                t("payment:payme.payButton", "Pay with Payme")
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {t("payment:payme.noAccount", "Don't have a Payme account?")}
            </p>
            <button
              type="button"
              onClick={handleRegisterClick}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {t("payment:payme.registerLink", "Register here")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymePhoneModal;
