/**
 * Smart Payment Polling Hook
 * Optimized based on Click.uz API behavior and status codes
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

const POLLING_CONFIG = {
  // Immediate check after payment initiation
  IMMEDIATE_CHECK: 5000, // 5 seconds
  
  // Short intervals for processing status (payment_status: 1)
  PROCESSING_INTERVAL: 15000, // 15 seconds
  
  // Medium intervals for created status (payment_status: 0)
  CREATED_INTERVAL: 30000, // 30 seconds
  
  // Long intervals for retries after errors
  ERROR_INTERVAL: 60000, // 1 minute
  
  // Maximum polling duration
  MAX_DURATION: 600000, // 10 minutes
  
  // Maximum consecutive errors before stopping
  MAX_ERRORS: 3,
  
  // Exponential backoff multiplier
  BACKOFF_MULTIPLIER: 1.5
};

const CLICK_STATUS = {
  ERROR: -1, // Any negative number
  CREATED: 0,
  PROCESSING: 1,
  SUCCESSFUL: 2
};

export const useSmartPaymentPolling = (bookingId, onPaymentSuccess, onPaymentError, options = {}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [pollingSince, setPollingSince] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [hasBeenStopped, setHasBeenStopped] = useState(false);
  
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);

  // Configuration options
  const {
    autoRestart = true, // Automatically restart polling on page load/refresh
    enablePageVisibilityRestart = true, // Restart when page becomes visible again
    restartStatuses = ['pending', 'selected'] // Booking statuses that should trigger auto restart
  } = options;

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const checkPaymentStatus = useCallback(async () => {
    if (!bookingId || !isPolling) return;

    try {
      setLastCheck(new Date());
      
      const response = await api.post(`/bookings/${bookingId}/check-payment-smart`);
      const { success, isPaid, paymentStatus: status, errorCode, errorNote, booking, manuallyApproved, provider } = response.data;

      setPaymentStatus(status);
      setErrorCount(0); // Reset error count on successful API call

      // Stop polling if payment completed OR booking manually approved
      if ((success && isPaid) || (booking?.status === 'approved' && booking?.paidAt)) {
        setIsPolling(false);
        setPollingCompleted(true);
        setHasBeenStopped(false); // Reset stopped state on successful completion
        onPaymentSuccess?.(response.data);
        return;
      }

      // Handle Payme-specific status codes
      if (provider === 'payme') {
        if (status === 2) {
          // Payme payment successful - should have been caught above, but double-check
          setIsPolling(false);
          setHasBeenStopped(false);
          onPaymentSuccess?.(response.data);
          return;
        } else if (status === 1) {
          // Payme payment pending - check frequently
          scheduleNextCheck(POLLING_CONFIG.PROCESSING_INTERVAL);
          return;
        } else if (status === -1 || status === -2) {
          // Payme payment cancelled
          console.warn('⚠️ Payme payment was cancelled');
          stopPolling('payme_cancelled');
          onPaymentError?.('Payme payment was cancelled');
          return;
        } else {
          // Unknown Payme status - use normal interval
          scheduleNextCheck(POLLING_CONFIG.CREATED_INTERVAL);
          return;
        }
      }

      // Handle Click.uz status codes (existing logic)
      if (errorCode < 0) {
        // Click.uz error (invoice not found, expired, etc.)
        console.warn(`❌ Click.uz Error ${errorCode}: ${errorNote}`);
        
        if (errorCode === -16) {
          // Payment not found - might be unpaid, schedule longer interval
          scheduleNextCheck(POLLING_CONFIG.CREATED_INTERVAL);
        } else {
          // Other errors - use error interval with backoff
          scheduleNextCheck(POLLING_CONFIG.ERROR_INTERVAL * Math.pow(POLLING_CONFIG.BACKOFF_MULTIPLIER, errorCount));
        }
        
        setErrorCount(prev => prev + 1);
        
        if (errorCount >= POLLING_CONFIG.MAX_ERRORS) {
          stopPolling('max_errors');
          onPaymentError?.(`Too many errors. Last error: ${errorNote}`);
          return;
        }
      } else if (status === CLICK_STATUS.PROCESSING) {
        // Payment is being processed - check frequently
        scheduleNextCheck(POLLING_CONFIG.PROCESSING_INTERVAL);
      } else if (status === CLICK_STATUS.CREATED) {
        // Payment created but not started - normal interval
        scheduleNextCheck(POLLING_CONFIG.CREATED_INTERVAL);
      } else {
        // Unknown status - use normal interval
        scheduleNextCheck(POLLING_CONFIG.CREATED_INTERVAL);
      }

    } catch (error) {
      console.error('❌ Payment polling API error:', error);
      setErrorCount(prev => prev + 1);
      
      if (errorCount >= POLLING_CONFIG.MAX_ERRORS) {
        stopPolling('network_errors');
        onPaymentError?.('Network error during payment verification');
        return;
      }
      
      // Network error - use exponential backoff
      const backoffInterval = POLLING_CONFIG.ERROR_INTERVAL * Math.pow(POLLING_CONFIG.BACKOFF_MULTIPLIER, errorCount);
      scheduleNextCheck(backoffInterval);
    }
  }, [bookingId, isPolling, errorCount, onPaymentSuccess, onPaymentError]);

  const scheduleNextCheck = useCallback((interval) => {
    if (!isPolling) return;
    
    // Check if we've exceeded maximum polling duration
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= POLLING_CONFIG.MAX_DURATION) {
      stopPolling('timeout');
      onPaymentError?.('Payment verification timeout');
      return;
    }
    
    // Ensure we don't exceed remaining time
    const remainingTime = POLLING_CONFIG.MAX_DURATION - elapsed;
    const actualInterval = Math.min(interval, remainingTime);
    
    timeoutRef.current = setTimeout(checkPaymentStatus, actualInterval);
  }, [isPolling, checkPaymentStatus, onPaymentError]);

  const startPolling = useCallback(() => {
    if (isPolling) return;
    
    setIsPolling(true);
    setPollingSince(new Date());
    setErrorCount(0);
    setPaymentStatus(null);
    setHasBeenStopped(false);
    startTimeRef.current = Date.now();
    
    // Start with immediate check
    setTimeout(checkPaymentStatus, POLLING_CONFIG.IMMEDIATE_CHECK);
  }, [isPolling, checkPaymentStatus]);

  const stopPolling = useCallback((reason = 'manual') => {
    setIsPolling(false);
    setPollingSince(null);
    if (reason === 'timeout' || reason === 'manual') {
      setHasBeenStopped(true);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Enhanced restart polling function
  const restartPolling = useCallback(async () => {
    if (isPolling || !bookingId) return;
    
    try {
      // Check current booking status before restarting
      const response = await api.post(`/bookings/${bookingId}/check-payment-smart`);
      const { booking } = response.data;
      
      if (booking && restartStatuses.includes(booking.status)) {
        setHasBeenStopped(false);
        startPolling();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error checking booking status for restart:', error);
      return false;
    }
  }, [bookingId, isPolling, restartStatuses, startPolling]);

  // Auto-restart polling on page visibility change (when user returns to tab)
  useEffect(() => {
    if (!enablePageVisibilityRestart || !bookingId) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && hasBeenStopped && !isPolling) {
        restartPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enablePageVisibilityRestart, bookingId, hasBeenStopped, isPolling, restartPolling]);

  // Auto-restart polling on component mount/page refresh
  useEffect(() => {
    if (!autoRestart || !bookingId || isPolling) return;

    const autoRestartOnMount = async () => {
      // Small delay to ensure component is fully mounted
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!isPolling && !hasBeenStopped) {
        restartPolling();
      }
    };

    autoRestartOnMount();
  }, [autoRestart, bookingId, isPolling, hasBeenStopped, restartPolling]);

  return {
    isPolling,
    pollingSince,
    lastCheck,
    errorCount,
    paymentStatus,
    hasBeenStopped,
    startPolling,
    stopPolling,
    restartPolling
  };
};

export default useSmartPaymentPolling;
