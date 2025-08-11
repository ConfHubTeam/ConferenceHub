import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";

export default function PhoneVerificationModal({ 
  isOpen, 
  onClose, 
  phoneNumber, 
  onVerificationSuccess,
  onVerificationError,
  isRegistration = false // New prop to indicate if this is for registration
}) {
  const { t } = useTranslation(['profile', 'common']);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Timer for countdown
  useEffect(() => {
    let timer;
    
    if (isOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isOpen, sessionId]); // Only depend on isOpen and sessionId, not timeLeft

  // Send verification code when modal opens
  useEffect(() => {
    if (isOpen && phoneNumber && !sessionId) {
      sendVerificationCode();
    }
  }, [isOpen, phoneNumber, sessionId]);

  const sendVerificationCode = async () => {
    if (!phoneNumber) return;
    
    setIsSendingCode(true);
    setError("");

    try {
      const endpoint = isRegistration 
        ? "/auth/registration/send-phone-code" 
        : "/users/send-phone-verification";
        
      const response = await api.post(endpoint, {
        phoneNumber: phoneNumber
      });

      if (response.data.success) {
        setSessionId(response.data.sessionId);
        setTimeLeft(response.data.expiresIn || 300);
        console.log("Verification code sent, timer started with:", response.data.expiresIn || 300, "seconds");
      } else {
        setError(response.data.error || t('profile:phoneVerification.sendError'));
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError(t('profile:phoneVerification.sendError'));
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError(t('profile:phoneVerification.invalidCodeLength'));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const endpoint = isRegistration 
        ? "/auth/registration/verify-phone-code" 
        : "/users/verify-phone";
        
      const response = await api.post(endpoint, {
        sessionId: sessionId,
        verificationCode: verificationCode,
        phoneNumber: phoneNumber
      });

      if (response.data.success) {
        // Verification successful
        onVerificationSuccess?.(response.data.user);
        onClose();
        
        // Reset state
        setVerificationCode("");
        setSessionId("");
        setTimeLeft(300);
      } else {
        setError(response.data.error || t('profile:phoneVerification.verifyError'));
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError(t('profile:phoneVerification.verifyError'));
      }
      
      onVerificationError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationCode("");
    setError("");
    await sendVerificationCode();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setVerificationCode("");
    setError("");
    setSessionId("");
    setTimeLeft(300);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('profile:phoneVerification.title')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label={t('common:buttons.close')}
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-2">
            {t('profile:phoneVerification.description')}
          </p>
          <p className="text-gray-800 font-medium">
            {phoneNumber}
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile:phoneVerification.codeLabel')}
            </label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                if (value.length <= 6) {
                  setVerificationCode(value);
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              autoFocus
              disabled={isLoading || isSendingCode}
            />
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              {timeLeft > 0 ? (
                <span>{t('profile:phoneVerification.expiresIn')} {formatTime(timeLeft)}</span>
              ) : (
                <span className="text-red-600">{t('profile:phoneVerification.expired')}</span>
              )}
              {/* Debug info - remove in production */}
              <span className="ml-2 text-xs text-gray-400">({timeLeft}s)</span>
            </div>
            
            <button
              type="button"
              onClick={handleResendCode}
              disabled={timeLeft > 0 || isSendingCode}
              className="text-sm text-primary hover:text-primary-dark disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isSendingCode ? t('profile:phoneVerification.sending') : t('profile:phoneVerification.resend')}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              {t('common:buttons.cancel')}
            </button>
            
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6 || timeLeft === 0}
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('profile:phoneVerification.verifying') : t('profile:phoneVerification.verify')}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          {t('profile:phoneVerification.note')}
        </div>
      </div>
    </div>
  );
}
