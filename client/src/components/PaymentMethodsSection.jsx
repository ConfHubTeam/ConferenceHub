import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ClickPhoneModal from "./ClickPhoneModal";
import PaymePhoneModal from "./PaymePhoneModal";
import CashPaymentModal from "./CashPaymentModal";
import OctoPaymentModal from "./OctoPaymentModal";
import api from "../utils/api";

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
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [agentContact, setAgentContact] = useState(null);
  const [isOctoModalOpen, setIsOctoModalOpen] = useState(false);

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
    if (!isPaymentAvailable) {
      onPaymentError?.(t("payment:errors.bookingNotSelected", "Payment will be available once the host selects your booking"));
      return;
    }
    setIsOctoModalOpen(true);
  };

  const handleCashPayment = () => {
    if (!isPaymentAvailable) {
      onPaymentError?.(t("payment:errors.bookingNotSelected", "Payment will be available once the host selects your booking"));
      return;
    }
    setIsCashModalOpen(true);
  };

  const handleCashPaymentConfirm = async () => {
    try {
      const response = await api.post(`/bookings/${booking.id}/select-cash`);

      // Store agent contact info from response
      if (response.data.agentContact) {
        setAgentContact(response.data.agentContact);
      }

      // Close modal first
      setIsCashModalOpen(false);

      // Notify parent component of successful cash payment selection
      onPaymentInitiated?.({
        paymentMethod: 'cash',
        bookingId: booking.id,
        agentsNotified: response.data.agentsNotified,
        agentContact: response.data.agentContact,
        message: response.data.message
      });

    } catch (error) {
      console.error('Cash payment selection error:', error);
      
      // Close modal on error as well
      setIsCashModalOpen(false);
      
      // Handle different error types with better messages
      if (error.response?.status === 401) {
        onPaymentError?.('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        onPaymentError?.('Access denied. Only clients can select cash payment.');
      } else if (error.response?.status === 404) {
        onPaymentError?.('Booking not found.');
      } else {
        onPaymentError?.(error.response?.data?.message || error.message || 'Failed to select cash payment');
      }
    }
  };

  const handleClickPaymentSuccess = (paymentData) => {
    setIsClickModalOpen(false);
    // Tag provider explicitly to allow Click-only polling upstream
    onPaymentInitiated?.({ ...paymentData, provider: 'click' });
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
      {/* Payment Methods Grid - 2x2 Layout */}
      <div className="grid grid-cols-2 gap-4">
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

        {/* Octo Payment */}
        <button
          onClick={handleOctoPayment}
          disabled={!isPaymentAvailable}
          className={`p-4 border-2 rounded-lg transition-all duration-200 h-32 flex items-center justify-center ${
            isPaymentAvailable
              ? 'border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
              : 'border-gray-200 cursor-not-allowed opacity-50 grayscale'
          }`}
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

        {/* Cash Payment */}
        <button
          onClick={handleCashPayment}
          disabled={!isPaymentAvailable}
          className={`p-4 border-2 rounded-lg transition-all duration-200 h-32 flex flex-col items-center justify-center ${
            isPaymentAvailable
              ? 'border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
              : 'border-gray-200 cursor-not-allowed opacity-50 grayscale'
          }`}
        >
          {/* Paper Money Icon - SVG */}
          <svg 
            className="w-12 h-12 mb-2" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M2 7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17V7Z" 
              stroke={isPaymentAvailable ? "#22c55e" : "#9ca3af"} 
              strokeWidth="2" 
              fill={isPaymentAvailable ? "#dcfce7" : "#f9fafb"}
            />
            <circle 
              cx="12" 
              cy="12" 
              r="3" 
              stroke={isPaymentAvailable ? "#16a34a" : "#6b7280"} 
              strokeWidth="2" 
              fill="none"
            />
            <path 
              d="M6 9C6 8.44772 6.44772 8 7 8C7.55228 8 8 8.44772 8 9"
              stroke={isPaymentAvailable ? "#16a34a" : "#6b7280"} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            <path 
              d="M16 15C16 15.5523 16.4477 16 17 16C17.5523 16 18 15.5523 18 15"
              stroke={isPaymentAvailable ? "#16a34a" : "#6b7280"} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </svg>
          <span className={`text-sm font-medium ${isPaymentAvailable ? 'text-gray-700' : 'text-gray-400'}`}>
            {t("payment:methods.cash", "Cash")}
          </span>
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

      {/* Cash Payment Modal */}
      <CashPaymentModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        onConfirm={handleCashPaymentConfirm}
        booking={booking}
        agentContact={agentContact}
      />

      {/* Octo Payment Modal */}
      <OctoPaymentModal
        isOpen={isOctoModalOpen}
        onClose={() => setIsOctoModalOpen(false)}
        booking={booking}
        onPaymentSuccess={(data) => {
          setIsOctoModalOpen(false);
          onPaymentInitiated?.(data);
        }}
        onPaymentError={(err) => {
          // Keep modal open to retry
          onPaymentError?.(err);
        }}
      />
    </div>
  );
};

export default PaymentMethodsSection;
