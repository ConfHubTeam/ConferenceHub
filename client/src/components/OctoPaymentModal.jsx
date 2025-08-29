import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";

/**
 * Octo Payment Modal Component
 * Shows booking ID and total sum; no phone input; opens Octo pay in a new window.
 */
const OctoPaymentModal = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { t } = useTranslation(["payment", "common"]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    if (isProcessing) return;
    setError("");
    setIsProcessing(false);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    // Pre-open a named window tied to user gesture; show interim content to avoid blank page
    let checkoutWindow = null;
    try {
      checkoutWindow = window.open("about:blank", "octo_checkout");
      if (checkoutWindow && !checkoutWindow.closed) {
        try {
          checkoutWindow.document.open();
          checkoutWindow.document.write(
            `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting…</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,\n Cantarell,Noto Sans,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff;color:#111}
              .box{max-width:420px;text-align:center}.spinner{width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}@keyframes spin{to{transform:rotate(360deg)}}
              a{color:#2563eb;text-decoration:none}</style></head>
              <body><div class="box"><div class="spinner"></div>
              <h1>Redirecting to Octo…</h1><p>Please wait. If this page stays here for more than a few seconds, <span id="alt"></span>.</p>
              </div><script>setTimeout(function(){document.getElementById('alt').innerHTML='<a href="#" onclick="window.close();return false;">close this window</a>'},8000)<\/script></body></html>`
          );
          checkoutWindow.document.close();
        } catch (_) {}
      }
    } catch (_) {
      // ignore
    }

    try {
      const returnUrl = `${window.location.origin}/account/bookings/${booking.id}`;
      const { data } = await api.post("/octo/prepare", {
        bookingId: booking.id,
        returnUrl
      });

      if (data?.success && data?.url) {
        // Navigate the pre-opened window if available; fallback to same tab to avoid popup blocking
        if (checkoutWindow && !checkoutWindow.closed) {
          try {
            checkoutWindow.location.replace(data.url);
          } catch (_) {
            checkoutWindow.location = data.url;
          }
        } else {
          // Popup likely blocked; navigate current tab
          window.location.assign(data.url);
        }

        onPaymentSuccess?.({
          provider: "octo",
          amount: booking.finalTotal || booking.totalPrice,
          bookingId: booking.id,
          payUrl: data.url,
          octoPaymentUUID: data.octoPaymentUUID,
          shopTransactionId: data.shopTransactionId
        });

        onClose?.();
      } else {
        throw new Error(data?.error || "Failed to create Octo payment");
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || t("payment:errors.paymentFailed", "Payment failed");
      setError(message);
      onPaymentError?.(message);
      // Close the pre-opened window if it exists and still blank
      try {
        if (checkoutWindow && !checkoutWindow.closed) {
          checkoutWindow.close();
        }
      } catch (_) {}
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {t("payment:octo.title", "Octo Payment")}
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
          <p className="text-sm text-gray-600 mb-4">
            {t("payment:octo.description", "Please confirm your booking details and proceed to Octo payment.")}
          </p>

          {/* Booking Info */}
          <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{t("payment:octo.bookingId", "Booking ID:")}</span>
              <span className="font-medium text-gray-900">{booking?.id}</span>
            </div>
            {booking?.uniqueRequestId && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{t("payment:octo.requestRef", "Reference:")}</span>
                <span className="font-mono text-gray-700">{booking.uniqueRequestId}</span>
              </div>
            )}
          </div>

          {/* Amount Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t("payment:octo.paymentAmount", "Payment Amount:")}</span>
              <span className="font-medium text-gray-900">{(booking.finalTotal || booking.totalPrice)?.toLocaleString()} UZS</span>
            </div>
          </div>

          {/* Error */}
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
              disabled={isProcessing}
            >
              {t("common:cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                isProcessing ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("payment:octo.processing", "Processing...")}
                </div>
              ) : (
                t("payment:octo.payButton", "Pay with Octo")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OctoPaymentModal;
