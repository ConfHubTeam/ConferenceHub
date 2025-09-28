import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";

/**
 * Cash Payment Modal Component
 * Displays instructions for cash payment to agents
 * Follows SOLID principles and DRY approach
 */
const CashPaymentModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  booking,
  agentContact: providedAgentContact 
}) => {
  const { t } = useTranslation(["payment", "common"]);
  const [agentContact, setAgentContact] = useState(providedAgentContact);
  const [loading, setLoading] = useState(false);
  const [agentNotified, setAgentNotified] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState(null);
  const [showAlreadyNotified, setShowAlreadyNotified] = useState(false);

  // Fetch agent contact info when modal opens if not provided
  useEffect(() => {
    if (isOpen && !agentContact) {
      fetchAgentContact();
    }
  }, [isOpen, agentContact]);

  // Update agent contact when provided from parent
  useEffect(() => {
    if (providedAgentContact) {
      setAgentContact(providedAgentContact);
    }
  }, [providedAgentContact]);

  const fetchAgentContact = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/agents/contact');
      if (response.data.success && response.data.agentContact) {
        setAgentContact(response.data.agentContact);
      }
    } catch (error) {
      console.error('Failed to fetch agent contact:', error);
      // Don't set fallback contact info - leave as null
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    const now = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Check if agent was notified within the last 5 minutes
    if (lastNotificationTime && (now - lastNotificationTime) < fiveMinutes) {
      setShowAlreadyNotified(true);
      // Hide the notification after 3 seconds
      setTimeout(() => setShowAlreadyNotified(false), 3000);
      return;
    }
    
    // Send notification
    setAgentNotified(true);
    setLastNotificationTime(now);
    onConfirm?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 md:p-4 pt-16 md:pt-16 pb-4">
      <div className="bg-white rounded-lg max-w-5xl w-full mx-2 md:mx-4 shadow-xl max-h-[80vh] md:max-h-[calc(100vh-8rem)] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("payment:cash.modalTitle", "Cash Payment")}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Already Notified Alert */}
        {showAlreadyNotified && (
          <div className="px-6 py-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3 flex-shrink-0"></div>
              <p className="text-sm text-yellow-800 font-medium">
                {t("payment:cash.alreadyNotified", "Agent already been notified. Please wait 5 minutes before sending another notification.")}
              </p>
            </div>
          </div>
        )}

        {/* Modal Body - Two Column Layout */}
        <div className="px-6 py-3 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Column - Cash Payment via Agent */}
            <div className="space-y-3">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg 
                    className="w-4 h-4 text-blue-600" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M2 7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17V7Z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      fill="#dbeafe"
                    />
                    <circle 
                      cx="12" 
                      cy="12" 
                      r="3" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      fill="none"
                    />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-gray-900">
                  {t("payment:cash.title", "Cash Payment")}
                </h4>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {t("payment:cash.instruction")}
              </p>

              {/* Agent Contact Info */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h5 className="font-medium text-blue-900 mb-3 text-sm">
                  {t("payment:cash.contactTitle")}
                </h5>
                {loading ? (
                  <div className="text-sm text-blue-800">
                    {t("common:loading", "Loading...")}
                  </div>
                ) : agentContact ? (
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span className="font-medium">{t("common:name", "Name")}:</span>
                      <span>{agentContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{t("common:phone", "Phone")}:</span>
                      <a href={`tel:${agentContact.phone}`} className="text-blue-600 hover:underline">
                        {agentContact.phone}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{t("common:email", "Email")}:</span>
                      <a href={`mailto:${agentContact.email}`} className="text-blue-600 hover:underline">
                        {agentContact.email}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-blue-800">
                    {t("payment:cash.contactUnavailable")}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Bank Transfer */}
            <div className="space-y-3">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg 
                    className="w-4 h-4 text-green-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
                    />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-gray-900">
                  {t("payment:cash.bankTransferTitle", "Bank Transfer")}
                </h4>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {t("payment:cash.bankTransferOption")}
              </p>

              {/* Bank Details Info */}
              <div className="bg-green-50 rounded-lg p-3">
                <h5 className="font-medium text-green-900 mb-3 text-sm">
                  {t("booking:contactInfo.bankDetails.title", "Bank Transfer Details")}
                </h5>
                
                {/* Company Info */}
                <div className="border-b border-green-200 pb-2 mb-3">
                  <div className="font-semibold text-green-900 text-sm">{t("payment:cash.companyName")}</div>
                  <div className="text-green-700 text-xs">{t("payment:cash.director")}</div>
                </div>
                
                <div className="space-y-2 text-xs text-green-800">
                  {/* Account Number */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-700">
                      {t("booking:contactInfo.bankDetails.accountNumber", "Account")}:
                    </span>
                    <span className="font-mono">{t("payment:cash.accountNumber")}</span>
                  </div>
                  
                  {/* Bank Name */}
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-green-700 flex-shrink-0 mr-2">
                      {t("booking:contactInfo.bankDetails.bankName", "Bank")}:
                    </span>
                    <span className="text-right">{t("payment:cash.bankName")}</span>
                  </div>
                  
                  {/* Bank Branch */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-700">
                      {t("booking:contactInfo.bankDetails.bankBranch", "Branch")}:
                    </span>
                    <span>{t("payment:cash.bankBranch")}</span>
                  </div>
                  
                  {/* MFO */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-700">
                      {t("booking:contactInfo.bankDetails.mfo", "MFO")}:
                    </span>
                    <span className="font-mono">{t("payment:cash.mfo")}</span>
                  </div>
                  
                  {/* INN */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-700">
                      {t("booking:contactInfo.bankDetails.inn", "INN")}:
                    </span>
                    <span className="font-mono">{t("payment:cash.inn")}</span>
                  </div>
                  
                  {/* Phone */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-700">
                      {t("booking:contactInfo.bankDetails.phone", "Phone")}:
                    </span>
                    <a 
                      href={`tel:+998${t("payment:cash.phoneNumber")}`}
                      className="text-green-600 hover:text-green-800 hover:underline font-mono"
                    >
                      +998 {t("payment:cash.phoneNumber")}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-6 py-2">
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium text-sm"
            >
              {t("common:cancel", "Cancel")}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-md transition-colors font-medium text-sm"
            >
              {t("payment:cash.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashPaymentModal;
