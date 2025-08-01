import React from "react";
import { useTranslation } from 'react-i18next';

const PaymentResponseDisplay = ({ paymentResponse, bookingId }) => {
  const { t } = useTranslation('booking');
  
  if (!paymentResponse) {
    return null;
  }

  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'prepared':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('payment.debug.responseTitle')}
        </h3>
        <span 
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(paymentResponse.status)}`}
        >
          {paymentResponse.status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">{t('payment.debug.bookingId')}:</span>
            <span className="ml-2 text-gray-900">{bookingId}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">{t('payment.debug.action')}:</span>
            <span className="ml-2 text-gray-900">{paymentResponse.action}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">{t('payment.debug.timestamp')}:</span>
            <span className="ml-2 text-gray-900">
              {new Date(paymentResponse.timestamp).toLocaleString()}
            </span>
          </div>
          {paymentResponse.error_code && (
            <div>
              <span className="font-medium text-gray-600">{t('payment.debug.errorCode')}:</span>
              <span className="ml-2 text-red-600">{paymentResponse.error_code}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('payment.debug.fullClickResponse')}:
          </label>
          <div className="bg-white border border-gray-300 rounded-md">
            <pre className="p-4 text-xs text-gray-800 overflow-auto max-h-64 whitespace-pre-wrap">
              {formatJson(paymentResponse.click_response)}
            </pre>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('payment.debug.completeResponse')}:
          </label>
          <div className="bg-white border border-gray-300 rounded-md">
            <pre className="p-4 text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap">
              {formatJson(paymentResponse)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResponseDisplay;
