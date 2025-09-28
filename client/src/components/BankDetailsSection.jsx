import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Bank Details Section Component
 * Displays company bank account information for direct transfers
 */
const BankDetailsSection = () => {
  const { t } = useTranslation('booking');

  const { t: tPayment } = useTranslation('payment');

  return (
    <div className="max-w-2xl">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-green-800 text-base">
            {t('details.contactInfo.bankDetails.title')}
          </h3>
        </div>

        <div className="space-y-3 text-sm">
          {/* Company Information */}
          <div className="border-b border-green-200 pb-3">
            <div className="font-semibold text-green-900 mb-1">
              {tPayment('cash.companyName')}
            </div>
            <div className="text-green-700">
              {tPayment('cash.director')}
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="font-medium text-green-700 mb-1">
              {t('details.contactInfo.bankDetails.address')}:
            </div>
            <div className="text-green-800 text-xs leading-relaxed">
              {tPayment('cash.companyAddress')}
            </div>
          </div>

          {/* Banking Information */}
          <div className="grid grid-cols-1 gap-2">
            {/* Account Number */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">
                {t('details.contactInfo.bankDetails.accountNumber')}:
              </span>
              <span className="text-green-800 font-mono text-xs">
                {tPayment('cash.accountNumber')}
              </span>
            </div>

            {/* Bank Name */}
            <div className="flex justify-between items-start">
              <span className="font-medium text-green-700 flex-shrink-0 mr-2">
                {t('details.contactInfo.bankDetails.bankName')}:
              </span>
              <span className="text-green-800 text-xs text-right">
                {tPayment('cash.bankName')}
              </span>
            </div>

            {/* Bank Branch */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">
                {t('details.contactInfo.bankDetails.bankBranch')}:
              </span>
              <span className="text-green-800 text-xs">
                {tPayment('cash.bankBranch')}
              </span>
            </div>

            {/* MFO */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">
                {t('details.contactInfo.bankDetails.mfo')}:
              </span>
              <span className="text-green-800 font-mono text-xs">
                {tPayment('cash.mfo')}
              </span>
            </div>

            {/* INN */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">
                {t('details.contactInfo.bankDetails.inn')}:
              </span>
              <span className="text-green-800 font-mono text-xs">
                {tPayment('cash.inn')}
              </span>
            </div>

            {/* Phone */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">
                {t('details.contactInfo.bankDetails.phone')}:
              </span>
              <a 
                href={`tel:+998${tPayment('cash.phoneNumber')}`}
                className="text-green-600 hover:text-green-800 hover:underline font-mono text-xs"
              >
                +998 {tPayment('cash.phoneNumber')}
              </a>
            </div>
          </div>

          {/* Note */}
          <div className="mt-3 pt-2 border-t border-green-200">
            <p className="text-xs text-green-600 italic">
              * {tPayment('cash.transferNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsSection;