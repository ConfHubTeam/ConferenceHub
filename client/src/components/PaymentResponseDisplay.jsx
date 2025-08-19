import React from "react";
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { enUS, ru, uz } from 'date-fns/locale';

const PaymentResponseDisplay = ({ paymentResponse, bookingId, booking }) => {
  const { t, i18n } = useTranslation('booking');
  
  // Get locale mapping for date-fns
  const getDateLocale = (language) => {
    switch (language) {
      case 'ru':
        return ru;
      case 'uz':
        return uz;
      default:
        return enUS;
    }
  };

  // Format date with localization
  const formatPaymentDate = (dateString) => {
    if (!dateString) return t('details.paymentResponse.labels.paymentDate') + ' N/A';
    
    try {
      const date = new Date(dateString);
      const locale = getDateLocale(i18n.language);
      
      // Use 24-hour format for Uzbek, 12-hour format for others
      const timeFormat = i18n.language === 'uz' ? 'PPP HH:mm' : 'PPP p';
      
      return format(date, timeFormat, { locale });
    } catch (error) {
      console.error('Error formatting payment date:', error);
      return 'Invalid Date';
    }
  };
  
  if (!paymentResponse && !booking?.click_payment_id) {
    return null;
  }

  const getProviderName = (booking, paymentResponse) => {
    // Check if it's a Payme payment based on payment response or provider field
    if (paymentResponse?.provider === 'payme' || paymentResponse?.transaction_id) {
      return 'Payme';
    }
    // Check if it's a Click payment based on actual database fields
    if (booking?.click_payment_id || booking?.click_invoice_id || paymentResponse?.payment_id) {
      return 'Click';
    }
    // Future: Add logic for Octo when implemented
    return 'Payment Provider';
  };

  const getStatusText = (status) => {
    // Handle Click.uz numeric status codes from the actual response
    if (typeof status === 'number') {
      switch (status) {
        case 0:
          return t('details.paymentResponse.status.created');
        case 1:
          return t('details.paymentResponse.status.processing');
        case 2:
          return t('details.paymentResponse.status.success');
        case 3:
          return t('details.paymentResponse.status.cancelled');
        case 4:
          return t('details.paymentResponse.status.failed');
        case 5:
          return t('details.paymentResponse.status.expired');
        case -99:
          return t('details.paymentResponse.status.deleted');
        default:
          return `Status ${status}`;
      }
    }
    
    // Handle string statuses
    const statusLower = status?.toString()?.toLowerCase();
    switch (statusLower) {
      case 'created':
        return t('details.paymentResponse.status.created');
      case 'processing':
        return t('details.paymentResponse.status.processing');
      case 'success':
        return t('details.paymentResponse.status.success');
      case 'cancelled':
        return t('details.paymentResponse.status.cancelled');
      case 'failed':
        return t('details.paymentResponse.status.failed');
      case 'expired':
        return t('details.paymentResponse.status.expired');
      case 'deleted':
        return t('details.paymentResponse.status.deleted');
      default:
        return status?.toString()?.charAt(0)?.toUpperCase() + status?.toString()?.slice(1)?.toLowerCase() || t('details.paymentResponse.status.unknown');
    }
  };

  const getStatusColor = (status) => {
    // Handle Click.uz numeric status codes
    if (typeof status === 'number') {
      switch (status) {
        case 0:
          return 'bg-blue-50 border-blue-200 text-blue-800'; // Created
        case 1:
          return 'bg-yellow-50 border-yellow-200 text-yellow-800'; // Processing
        case 2:
          return 'bg-green-50 border-green-200 text-green-800'; // Payment successful
        case 3:
        case 4:
        case 5:
          return 'bg-red-50 border-red-200 text-red-800'; // Cancelled/Failed/Expired
        case -99:
          return 'bg-gray-50 border-gray-200 text-gray-800'; // Deleted
        default:
          return 'bg-gray-50 border-gray-200 text-gray-800';
      }
    }
    
    // Handle string statuses
    switch (status?.toLowerCase()) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'prepared':
      case 'processing':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPaymentId = (booking, paymentResponse) => {
    // For Payme payments, use transaction_id from payment response
    if (paymentResponse?.provider === 'payme' && paymentResponse?.transaction_id) {
      return paymentResponse.transaction_id;
    }
    // For Click payments, use actual database fields
    return booking?.click_payment_id || paymentResponse?.payment_id || 'N/A';
  };

  const getPaymentDate = (booking) => {
    // Debug: Log the booking object to see what fields are available
    console.log('Booking object for payment date:', {
      paid_at: booking?.paid_at,
      paidAt: booking?.paidAt,
      click_invoice_created_at: booking?.click_invoice_created_at,
      createdAt: booking?.createdAt,
      updatedAt: booking?.updatedAt
    });
    
    // Use the paid_at timestamp from the database
    if (booking?.paid_at) {
      return formatPaymentDate(booking.paid_at);
    }
    
    // Try alternative field names (camelCase)
    if (booking?.paidAt) {
      return formatPaymentDate(booking.paidAt);
    }
    
    return 'N/A';
  };

  const providerName = getProviderName(booking, paymentResponse);
  const statusText = getStatusText(paymentResponse?.status);
  const statusColor = getStatusColor(paymentResponse?.status);
  const paymentId = getPaymentId(booking, paymentResponse);
  const paymentDate = getPaymentDate(booking);

  return (
    <div className="mt-6 p-6 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('details.paymentResponse.labels.provider', { provider: providerName })}
        </h3>
        <span 
          className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}
        >
          {statusText}
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-600">
            {t('details.paymentResponse.labels.paymentDate')}
          </span>
          <span className="ml-2 text-sm text-gray-900">{paymentDate}</span>
        </div>
        
        <div>
          <span className="text-sm font-medium text-gray-600">
            {t('details.paymentResponse.labels.paymentId')}
          </span>
          <span className="ml-2 text-sm font-mono text-gray-900">{paymentId}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentResponseDisplay;
