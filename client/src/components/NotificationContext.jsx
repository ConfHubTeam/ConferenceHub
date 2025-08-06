import { createContext, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const { t, ready } = useTranslation('common');
  
  // Show a notification with optional translation support
  const notify = (message, type = 'info', translationKey = null, translationOptions = {}) => {
    let displayMessage = message;
    
    // If a translation key is provided and i18n is ready, use translated message
    if (translationKey && ready) {
      try {
        displayMessage = t(translationKey, translationOptions);
      } catch (error) {
        // Fallback to original message if translation fails
        console.warn('Translation failed for key:', translationKey, error);
        displayMessage = message;
      }
    }
    
    setNotification({ message: displayMessage, type });
    
    // Auto-dismiss after 1.5 seconds (quick dismissal)
    setTimeout(() => {
      setNotification(null);
    }, 1500);
  };
  
  return (
    <NotificationContext.Provider value={{ notification, notify }}>
      {children}
      
      {notification && (
        <div className={`fixed top-20 md:top-24 md:right-4 left-4 right-4 md:left-auto md:w-80 md:max-w-sm mx-auto md:mx-0 py-3 px-6 rounded-md md:rounded-xl shadow-lg z-[80] transform transition-all duration-150 ease-out animate-in slide-in-from-top-2
          ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
            notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 
            'bg-blue-100 text-blue-800 border border-blue-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1 min-w-0">
              {notification.type === 'success' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
                </svg>
              )}
              <span className="break-words text-sm leading-relaxed">{notification.message}</span>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// Custom hook to use notification context
export const useNotification = () => useContext(NotificationContext);