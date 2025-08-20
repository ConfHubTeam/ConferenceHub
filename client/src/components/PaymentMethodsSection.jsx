import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ClickPhoneModal from "./ClickPhoneModal";
import PaymePhoneModal from "./PaymePhoneModal";

/**
 * Payment Methods Section Component
 * Displays all available payment methods with proper styling
 * Both Click and Payme payments are functional
 */
const PaymentMethodsSection = ({ 
  booking, 
  onPaymentInitiated, 
  onPaymentError,
  isPaymentAvailable 
}) => {
  const { t } = useTranslation(["payment", "common"]);
  const [isClickModalOpen, setIsClickModalOpen] = useState(false);
  const [isPaymeModalOpen, setIsPaymeModalOpen] = useState(false);

  const handleClickPayment = () => {
    if (!isPaymentAvailable) {
      onPaymentError?.(t("payment:errors.bookingNotSelected", "Payment will be available once the host selects your booking"));
      return;
    }
    setIsClickModalOpen(true);
  };

  const handlePaymePayment = () => {
    if (!isPaymentAvailable) {
      onPaymentError?.(t("payment:errors.bookingNotSelected", "Payment will be available once the host selects your booking"));
      return;
    }
    setIsPaymeModalOpen(true);
  };

  const handleOctoPayment = () => {
    onPaymentError?.("Octo payment is coming soon!");
  };

  const handleClickPaymentSuccess = (paymentData) => {
    setIsClickModalOpen(false);
    onPaymentInitiated?.(paymentData);
  };

  const handleClickPaymentError = (error) => {
    // Modal stays open so user can try again
    onPaymentError?.(error);
  };

  const handlePaymePaymentSuccess = (paymentData) => {
    setIsPaymeModalOpen(false);
    onPaymentInitiated?.(paymentData);
  };

  const handlePaymePaymentError = (error) => {
    // Modal stays open so user can try again
    onPaymentError?.(error);
  };

  return (
    <div className="space-y-4">
      {/* Payment Methods Grid - Side by Side */}
      <div className="grid grid-cols-3 gap-4">
        {/* Click Payment */}
        <button
          onClick={handleClickPayment}
          disabled={!isPaymentAvailable}
          className={`p-4 border-2 rounded-lg transition-all duration-200 h-32 flex items-center justify-center ${
            isPaymentAvailable
              ? 'border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
              : 'border-gray-200 cursor-not-allowed opacity-50 grayscale'
          }`}
        >
          <img 
            src="/images/click_pay_icon.jpg" 
            alt="Click Payment"
            className="w-full h-full object-contain"
            onError={(e) => {
              console.log('Click logo failed to load');
              e.target.style.display = 'none';
            }}
          />
        </button>

        {/* Payme Payment */}
        <button
          onClick={handlePaymePayment}
          disabled={!isPaymentAvailable}
          className={`p-4 border-2 rounded-lg transition-all duration-200 h-32 flex items-center justify-center ${
            isPaymentAvailable
              ? 'border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
              : 'border-gray-200 cursor-not-allowed opacity-50 grayscale'
          }`}
        >
          <img 
            src="/images/payme_icon.png" 
            alt="Payme Payment"
            className="w-full h-full object-contain"
            onError={(e) => {
              console.log('Payme logo failed to load');
              e.target.style.display = 'none';
            }}
          />
        </button>

        {/* Octo Payment - Placeholder */}
        <button
          onClick={handleOctoPayment}
          disabled={true}
          className="p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed h-32 flex items-center justify-center grayscale"
        >
          <img 
            src="/images/octo_pay_icon.webp" 
            alt="Octo Payment"
            className="w-full h-full object-contain"
            onError={(e) => {
              console.log('Octo logo failed to load');
              e.target.style.display = 'none';
            }}
          />
        </button>
      </div>

      {/* Click Phone Verification Modal */}
      <ClickPhoneModal
        isOpen={isClickModalOpen}
        onClose={() => setIsClickModalOpen(false)}
        booking={booking}
        onPaymentSuccess={handleClickPaymentSuccess}
        onPaymentError={handleClickPaymentError}
      />

      {/* Payme Phone Verification Modal */}
      <PaymePhoneModal
        isOpen={isPaymeModalOpen}
        onClose={() => setIsPaymeModalOpen(false)}
        booking={booking}
        onPaymentSuccess={handlePaymePaymentSuccess}
        onPaymentError={handlePaymePaymentError}
      />
    </div>
  );
};

export default PaymentMethodsSection;
