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

export const useSmartPaymentPolling = (bookingId, onPaymentSuccess, onPaymentError) => {
  const [isPolling, setIsPolling] = useState(false);
  const [pollingSince, setPollingSince] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);

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
      const { success, isPaid, paymentStatus: status, errorCode, errorNote } = response.data;

      setPaymentStatus(status);
      setErrorCount(0); // Reset error count on successful API call

      if (success && isPaid) {
        // Payment completed successfully
        setIsPolling(false);
        onPaymentSuccess?.(response.data);
        return;
      }

      // Handle different Click.uz status codes
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
          setIsPolling(false);
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
        setIsPolling(false);
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
      setIsPolling(false);
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
    startTimeRef.current = Date.now();
    
    // Start with immediate check
    setTimeout(checkPaymentStatus, POLLING_CONFIG.IMMEDIATE_CHECK);
  }, [isPolling, checkPaymentStatus]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    setPollingSince(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    isPolling,
    pollingSince,
    lastCheck,
    errorCount,
    paymentStatus,
    startPolling,
    stopPolling
  };
};

export default useSmartPaymentPolling;
