import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import PaymePhoneModal from "./PaymePhoneModal";

/**
 * Payme Payment Button Component
 * Handles the Payme payment flow by opening the phone verification modal
 * Similar to ClickPaymentButton but for Payme payments
 */
const PaymePaymentButton = ({ 
  booking, 
  onPaymentInitiated, 
  onPaymentError,
  className = "",
  disabled = false 
}) => {
  const { t } = useTranslation(["payment", "common"]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = () => {
    // Check if booking is in the correct status for payment
    if (booking.status !== 'selected') {
      onPaymentError?.(t("payment:errors.bookingNotSelected", "Payment will be available once the host selects your booking"));
      return;
    }

    // Open the phone verification modal
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    setIsModalOpen(false);
    onPaymentInitiated?.(paymentData);
  };

  const handlePaymentError = (error) => {
    // Modal stays open so user can try again with different phone number
    onPaymentError?.(error);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const isPaymentAvailable = booking.status === 'selected';

  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={disabled || !isPaymentAvailable}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          disabled || !isPaymentAvailable
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        } ${className}`}
      >
        <div className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          {t("payment:paymePayment.button", "Pay with Payme")}
        </div>
      </button>

      {/* Phone Verification Modal */}
      <PaymePhoneModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        booking={booking}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </>
  );
};

export default PaymePaymentButton;
