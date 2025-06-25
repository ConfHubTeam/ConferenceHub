import { useState, useEffect } from 'react';
import api from '../utils/api';
import { getCurrentDateInUzbekistan, getCurrentDateObjectInUzbekistan } from '../utils/uzbekistanTimezoneUtils';

/**
 * Debug component to help troubleshoot timezone issues
 * Add this temporarily to any page to see debug info
 */
export default function TimezoneDebugger({ placeId = null }) {
  const [debugInfo, setDebugInfo] = useState(null);
  const [testDate, setTestDate] = useState('2025-06-25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🐛 FRONTEND DEBUG - Fetching debug info...');
      
      // Try to fetch all endpoints, but handle individual failures
      const requests = [
        api.get('/debug/timezone').catch(err => ({ error: `Timezone: ${err.message}` })),
        api.get(`/debug/test-availability/${testDate}`).catch(err => ({ error: `Test availability: ${err.message}` })),
        api.get('/debug/test-june-dates').catch(err => ({ error: `June dates: ${err.message}` })),
        api.get('/debug/test-calendar-min-date').catch(err => ({ error: `Calendar min date: ${err.message}` }))
      ];
      
      // Add availability check if placeId is provided
      if (placeId) {
        requests.push(
          api.get(`/bookings/availability/uzbekistan?placeId=${placeId}`).catch(err => ({ error: `Availability: ${err.message}` }))
        );
      }
      
      const responses = await Promise.all(requests);
      const [timezoneResponse, testResponse, juneTestResponse, minDateResponse, availabilityResponse] = responses;

      const clientDebug = {
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        clientCurrentTime: new Date().toISOString(),
        clientLocalTime: new Date().toString(),
        uzbekistanDateFromClient: getCurrentDateInUzbekistan(),
        uzbekistanDateObjectFromClient: getCurrentDateObjectInUzbekistan().toISOString(),
        browserLanguage: navigator.language,
        userAgent: navigator.userAgent.substring(0, 100) + '...'
      };

      console.log('🐛 FRONTEND DEBUG - Client info:', clientDebug);
      
      if (timezoneResponse.data) {
        console.log('🐛 FRONTEND DEBUG - Server timezone info:', timezoneResponse.data);
      }
      if (juneTestResponse.data) {
        console.log('🐛 FRONTEND DEBUG - June dates test:', juneTestResponse.data);
      }

      setDebugInfo({
        server: timezoneResponse.data || timezoneResponse,
        client: clientDebug,
        testAvailability: testResponse.data || testResponse,
        juneTest: juneTestResponse.data || juneTestResponse,
        minDateTest: minDateResponse.data || minDateResponse,
        bookingAvailability: availabilityResponse?.data || availabilityResponse || null
      });
    } catch (error) {
      console.error('🐛 FRONTEND DEBUG ERROR:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSpecificDate = async () => {
    try {
      const response = await api.get(`/debug/test-availability/${testDate}`);
      setDebugInfo(prev => ({
        ...prev,
        testAvailability: response.data
      }));
    } catch (error) {
      console.error('Test date error:', error);
      setError(error.response?.data?.error || error.message);
    }
  };

  const testBookingAvailability = async () => {
    if (!placeId) {
      alert('No place ID provided for booking availability test');
      return;
    }
    try {
      const response = await api.get(`/debug/booking-availability/${placeId}/${testDate}`);
      setDebugInfo(prev => ({
        ...prev,
        bookingAvailability: response.data
      }));
    } catch (error) {
      console.error('Booking availability error:', error);
      setError(error.response?.data?.error || error.message);
    }
  };

  if (loading && !debugInfo) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
          Loading debug info...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4 text-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-yellow-800">🐛 Timezone Debug Info</h3>
        <div className="space-x-2">
          <button 
            onClick={fetchDebugInfo}
            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {debugInfo && !error && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Critical Issues */}
          <div className="bg-red-50 border border-red-200 p-3 rounded">
            <h4 className="font-semibold text-red-800 mb-2">🚨 Critical Issues</h4>
            <div className="space-y-1 text-sm">
              {debugInfo.server?.error && (
                <div className="text-red-700">
                  ❌ Server error: {debugInfo.server.error}
                </div>
              )}
              {debugInfo.server?.serverTimezone && debugInfo.server.serverTimezone !== 'Asia/Tashkent' && (
                <div className="text-red-700">
                  ❌ Server timezone is {debugInfo.server.serverTimezone}, should be Asia/Tashkent
                </div>
              )}
              {debugInfo.server?.uzbekistanDate && debugInfo.server.uzbekistanDate !== debugInfo.client.uzbekistanDateFromClient && (
                <div className="text-red-700">
                  ❌ Server/Client Uzbekistan date mismatch: {debugInfo.server.uzbekistanDate} vs {debugInfo.client.uzbekistanDateFromClient}
                </div>
              )}
              {debugInfo.juneTest?.tests?.june25?.isInPast && (
                <div className="text-red-700">
                  ❌ June 25th is marked as past (should be selectable)
                </div>
              )}
              {debugInfo.juneTest?.error && (
                <div className="text-red-700">
                  ❌ June test error: {debugInfo.juneTest.error}
                </div>
              )}
            </div>
          </div>

          {/* Server Info */}
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold text-gray-800 mb-2">🖥️ Server Information</h4>
            {debugInfo.server?.error ? (
              <div className="text-red-600 text-sm">Error: {debugInfo.server.error}</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>Server Timezone:</strong> {debugInfo.server?.serverTimezone || 'Unknown'}</div>
                <div><strong>Environment TZ:</strong> {debugInfo.server?.envTimezone || 'Not set'}</div>
                <div><strong>Server Time:</strong> {debugInfo.server?.serverTime || 'Unknown'}</div>
                <div><strong>Uzbekistan Time:</strong> {debugInfo.server?.uzbekistanTime || 'Unknown'}</div>
                <div><strong>Uzbekistan Date:</strong> {debugInfo.server?.uzbekistanDate || 'Unknown'}</div>
                <div><strong>Node Environment:</strong> {debugInfo.server?.nodeEnv || 'Unknown'}</div>
              </div>
            )}
          </div>

          {/* Client Info */}
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold text-gray-800 mb-2">💻 Client Information</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><strong>Client Timezone:</strong> {debugInfo.client.clientTimezone}</div>
              <div><strong>Client Time:</strong> {debugInfo.client.clientCurrentTime}</div>
              <div><strong>Uzbekistan Date (Client):</strong> {debugInfo.client.uzbekistanDateFromClient}</div>
              <div><strong>Browser Language:</strong> {debugInfo.client.browserLanguage}</div>
            </div>
          </div>

          {/* June Dates Test */}
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold text-gray-800 mb-2">📅 June Dates Test</h4>
            <div className="space-y-2 text-xs">
              <div>
                <strong>Current Uzbekistan Date:</strong> {debugInfo.juneTest?.currentDateUzbekistan}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>June 25th:</strong>
                  <div className={debugInfo.juneTest?.tests?.june25?.isInPast ? 'text-red-600' : 'text-green-600'}>
                    {debugInfo.juneTest?.tests?.june25?.isInPast ? '❌ Past' : '✅ Available'}
                  </div>
                </div>
                <div>
                  <strong>June 26th:</strong>
                  <div className={debugInfo.juneTest?.tests?.june26?.isInPast ? 'text-red-600' : 'text-green-600'}>
                    {debugInfo.juneTest?.tests?.june26?.isInPast ? '❌ Past' : '✅ Available'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Availability */}
          {debugInfo.bookingAvailability && (
            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold text-gray-800 mb-2">📊 Calendar Availability Data</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <strong>Available Dates Array:</strong> 
                  <div className="mt-1 p-2 bg-gray-100 rounded">
                    {debugInfo.bookingAvailability.availableDates ? 
                      `[${debugInfo.bookingAvailability.availableDates.join(', ')}]` : 
                      'None'
                    }
                  </div>
                </div>
                <div>
                  <strong>Is June 25 in available dates?</strong>
                  <span className={debugInfo.bookingAvailability.availableDates?.includes('2025-06-25') ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                    {debugInfo.bookingAvailability.availableDates?.includes('2025-06-25') ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div>
                  <strong>Total Available Dates:</strong> {debugInfo.bookingAvailability.availableDates?.length || 0}
                </div>
              </div>
            </div>
          )}

          {/* Test Controls */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <h4 className="font-semibold text-blue-800 mb-2">🧪 Test Controls</h4>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="px-2 py-1 border rounded text-xs"
              />
              <button
                onClick={testSpecificDate}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Test Date
              </button>
              {placeId && (
                <button
                  onClick={testBookingAvailability}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Test Booking
                </button>
              )}
            </div>
            {debugInfo.testAvailability && (
              <div className="text-xs">
                <strong>Test Result for {debugInfo.testAvailability.inputDate}:</strong>
                <span className={debugInfo.testAvailability.isInPast ? 'text-red-600 ml-2' : 'text-green-600 ml-2'}>
                  {debugInfo.testAvailability.isInPast ? 'In Past' : 'Available'}
                </span>
              </div>
            )}
          </div>

          {/* Raw Data (Collapsible) */}
          <details className="bg-gray-50 border border-gray-200 p-3 rounded">
            <summary className="font-semibold text-gray-800 cursor-pointer">📋 Raw Debug Data</summary>
            <pre className="text-xs mt-2 overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// Export as both default and named export
export { TimezoneDebugger };
