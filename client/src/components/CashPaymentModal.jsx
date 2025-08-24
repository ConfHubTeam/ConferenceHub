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
    onConfirm?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-6 py-4">
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

        {/* Modal Body */}
        <div className="px-6 py-4">
          {/* Cash Payment Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-green-600" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M2 7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17V7Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="#dcfce7"
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
          </div>

          {/* Instructions */}
          <div className="text-center space-y-3 mb-4">
            <p className="text-gray-600">
              {t("payment:cash.instruction", "Our agent will contact you to arrange cash payment.")}
            </p>

                        {/* Agent Contact Info */}
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h5 className="font-medium text-blue-900 mb-2">
                {t("payment:cash.contactTitle", "Agent Contact")}
              </h5>
              {loading ? (
                <div className="text-sm text-blue-800">
                  {t("common:loading", "Loading...")}
                </div>
              ) : agentContact ? (
                <div className="space-y-1 text-sm text-blue-800">
                  <p>
                    <span className="font-medium">{t("common:name", "Name")}:</span> {agentContact.name}
                  </p>
                  <p>
                    <span className="font-medium">{t("common:phone", "Phone")}:</span> {agentContact.phone}
                  </p>
                  <p>
                    <span className="font-medium">{t("common:email", "Email")}:</span> {agentContact.email}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-blue-800">
                  {t("payment:cash.contactUnavailable", "Agent contact information will be provided after confirmation.")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            {t("common:cancel", "Cancel")}
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            {t("payment:cash.confirm", "Confirm Cash Payment")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashPaymentModal;
