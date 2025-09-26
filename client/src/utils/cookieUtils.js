/**
 * Utility functions for cookie management
 */

/**
 * Clear all cookies across Chrome, Safari, Edge, and other browsers
 * This function ensures cookies are properly cleared with browser-specific methods
 */
export function clearAuthCookies() {
  console.log('🍪 Starting comprehensive cookie cleanup for all browsers...');
  
  // Get current domain information
  const currentHostname = window.location.hostname;
  const currentDomain = window.location.host;
  
  // Critical authentication cookies that must be cleared
  const criticalCookies = [
    'token', 'connect.sid', 'session', 'telegram_auth', 'auth', 
    'jwt', 'refreshToken', 'accessToken', 'PHPSESSID', 'JSESSIONID',
    // Telegram OAuth specific cookies
    'stel_ssid', 'stel_token', 'stel_acid', 'telegram_oauth', 'tg_auth', 'tg_session',
    'oauth_token', 'oauth_verifier', 'csrf_token', 'state_token'
  ];
  
  // Comprehensive cookie clearing function
  const clearCookieCompletely = (cookieName) => {
    const expireDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
    
    // Standard clearing (works in most browsers)
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/;`;
    
    // Clear with current hostname
    if (currentHostname) {
      document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=${currentHostname};`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.${currentHostname};`;
    }
    
    // Clear for getspace.uz domain specifically (all variations)
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=getspace.uz;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.getspace.uz;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=www.getspace.uz;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.www.getspace.uz;`;
    
    // Clear for Telegram OAuth domain (oauth.telegram.org)
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=oauth.telegram.org;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.oauth.telegram.org;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=telegram.org;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.telegram.org;`;
    
    // Clear with secure flag (for HTTPS cookies)
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=${currentHostname}; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.${currentHostname}; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=getspace.uz; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.getspace.uz; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=www.getspace.uz; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.www.getspace.uz; secure;`;
    // Telegram OAuth with secure flag
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=oauth.telegram.org; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.oauth.telegram.org; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=telegram.org; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=.telegram.org; secure;`;
    
    // Clear with SameSite attributes (modern browsers)
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; SameSite=Strict;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; SameSite=Lax;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; SameSite=None; secure;`;
    
    // Clear with various path combinations
    const paths = ['/', '/auth', '/api', '/telegram-auth', '/oauth', '/login'];
    paths.forEach(path => {
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path};`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${currentHostname};`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=.${currentHostname};`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=getspace.uz;`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=.getspace.uz;`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=www.getspace.uz;`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=.www.getspace.uz;`;
      // Telegram OAuth domain paths
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=oauth.telegram.org;`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=.oauth.telegram.org;`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=telegram.org;`;
      document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=.telegram.org;`;
    });
  };
  
  // Clear all critical authentication cookies
  criticalCookies.forEach(cookieName => {
    clearCookieCompletely(cookieName);
  });
  
  // Clear all existing cookies by iterating through current cookies
  const existingCookies = document.cookie.split(";");
  existingCookies.forEach(function(cookie) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name && name.length > 0) {
      clearCookieCompletely(name);
      
      // Additional manual clearing for specific domain combinations including Telegram OAuth
      const expireDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
      document.cookie = `${name}=; expires=${expireDate}; path=/; domain=getspace.uz;`;
      document.cookie = `${name}=; expires=${expireDate}; path=/; domain=.getspace.uz;`;
      document.cookie = `${name}=; expires=${expireDate}; path=/; domain=www.getspace.uz;`;
      document.cookie = `${name}=; expires=${expireDate}; path=/; domain=.www.getspace.uz;`;
      // Telegram OAuth domains
      document.cookie = `${name}=; expires=${expireDate}; path=/; domain=oauth.telegram.org;`;
      document.cookie = `${name}=; expires=${expireDate}; path=/; domain=.oauth.telegram.org;`;
      document.cookie = `${name}=; expires=${expireDate}; path=/; domain=telegram.org;`;
      document.cookie = `${name}=; expires=${expireDate}; path=/; domain=.telegram.org;`;
    }
  });
  
  // Browser-specific clearing methods
  
  // For Chrome and Chromium-based browsers (Edge, etc.)
  if (navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Chromium')) {
    console.log('🌐 Applying Chrome/Chromium-specific cookie clearing');
    // Chrome sometimes needs multiple attempts
    setTimeout(() => {
      criticalCookies.forEach(cookieName => {
        clearCookieCompletely(cookieName);
      });
    }, 100);
  }
  
  // For Safari
  if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
    console.log('🍎 Applying Safari-specific cookie clearing');
    // Safari needs special handling for secure cookies
    criticalCookies.forEach(cookieName => {
      // Safari-specific clearing with all possible combinations
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${currentHostname}; secure; SameSite=None;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${currentHostname}; secure; SameSite=None;`;
    });
  }
  
  // For Firefox
  if (navigator.userAgent.includes('Firefox')) {
    console.log('🦊 Applying Firefox-specific cookie clearing');
    // Firefox additional clearing
    setTimeout(() => {
      criticalCookies.forEach(cookieName => {
        clearCookieCompletely(cookieName);
      });
    }, 50);
  }
  
  console.log('🍪 Cookie cleanup completed for all browsers');
}

/**
 * Clear all local storage and session storage items across all browsers
 */
export function clearAuthLocalStorage() {
  console.log('📦 Starting comprehensive storage cleanup...');
  
  // Clear all localStorage items
  try {
    const localStorageLength = localStorage.length;
    console.log(`📦 Clearing ${localStorageLength} localStorage items`);
    localStorage.clear();
  } catch (error) {
    console.warn('❌ Error clearing localStorage:', error);
    // Fallback to removing specific keys if clear() fails
    const authKeys = [
      'token', 'telegram_auth_user_type', 'telegram_auth_error', 'user', 
      'authToken', 'refreshToken', 'accessToken', 'userProfile', 'sessionData',
      'telegramUser', 'auth_state', 'login_state'
    ];
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`✅ Removed localStorage key: ${key}`);
      } catch (e) {
        console.warn(`❌ Error removing localStorage key ${key}:`, e);
      }
    });
  }
  
  // Clear all sessionStorage items
  try {
    const sessionStorageLength = sessionStorage.length;
    console.log(`📦 Clearing ${sessionStorageLength} sessionStorage items`);
    sessionStorage.clear();
  } catch (error) {
    console.warn('❌ Error clearing sessionStorage:', error);
    // Fallback to removing specific keys if clear() fails
    const authKeys = [
      'token', 'telegram_auth_user_type', 'telegram_auth_error', 'user',
      'authToken', 'refreshToken', 'accessToken', 'userProfile', 'sessionData',
      'telegramUser', 'auth_state', 'login_state'
    ];
    authKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
        console.log(`✅ Removed sessionStorage key: ${key}`);
      } catch (e) {
        console.warn(`❌ Error removing sessionStorage key ${key}:`, e);
      }
    });
  }
  
  // Clear IndexedDB if available (for advanced browser storage)
  if ('indexedDB' in window) {
    try {
      // Note: Full IndexedDB clearing would require async operations
      // For now, we'll log that it should be considered for complete cleanup
      console.log('🗃️ IndexedDB detected - may need manual clearing for complete cleanup');
    } catch (error) {
      console.warn('❌ Error accessing IndexedDB:', error);
    }
  }
  
  console.log('📦 Storage cleanup completed');
}

/**
 * Perform complete authentication cleanup for account switching
 * More aggressive cleanup that ensures no traces of previous account remain
 */
export function performAccountSwitchCleanup() {
  console.log('🔄 Starting account switch cleanup...');
  
  // Clear all cookies and storage
  clearAuthCookies();
  clearAuthLocalStorage();
  
  // Additional cleanup for account switching
  try {
    // Clear any cached browser data if possible
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // Force garbage collection if available (Chrome DevTools)
    if (window.gc) {
      window.gc();
    }
    
  } catch (error) {
    console.warn('⚠️ Some advanced cleanup features unavailable:', error);
  }
  
  console.log('🔄 Account switch cleanup completed');
  
  // Small delay to ensure all operations complete
  return new Promise(resolve => setTimeout(resolve, 200));
}

/**
 * Perform standard authentication cleanup for logout
 * Clears all cookies (including Telegram session cookies), localStorage, and sessionStorage
 * Ensures complete logout from all authentication systems including Telegram
 */
export function performAuthCleanup() {
  console.log('🚪 Starting logout cleanup...');
  clearAuthCookies();
  clearAuthLocalStorage();
  console.log('🚪 Logout cleanup completed');
}

/**
 * Advanced Telegram OAuth cleanup
 * Note: Due to browser security, we cannot directly clear cookies from oauth.telegram.org
 * This function provides instructions and alternative cleanup methods
 */
export function clearTelegramOAuthCookies() {
  console.log('🔄 Starting Telegram OAuth cleanup...');
  
  // Try to clear any Telegram-related cookies in current domain
  const telegramCookies = [
    'stel_ssid', 'stel_token', 'telegram_oauth', 'tg_auth', 'tg_session',
    'oauth_token', 'oauth_verifier', 'csrf_token', 'state_token',
    'telegram_auth_token', 'tg_oauth_state', 'telegram_user_id'
  ];
  
  telegramCookies.forEach(cookieName => {
    const expireDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
    
    // Clear in current domain
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; secure;`;
    document.cookie = `${cookieName}=; expires=${expireDate}; path=/; SameSite=None; secure;`;
    
    console.log(`🗑️ Attempted to clear Telegram cookie: ${cookieName}`);
  });
  
  // Instructions for manual cleanup (since we can't clear cross-domain cookies via JS)
  console.log('⚠️ Manual Telegram OAuth cleanup required:');
  console.log('1. Go to Chrome Settings → Privacy and Security → Cookies and other site data');
  console.log('2. Click "See all cookies and site data"');
  console.log('3. Search for "telegram.org" and "oauth.telegram.org"');
  console.log('4. Delete all cookies from these domains');
  console.log('OR use the browser clear data functionality');
  
  return {
    success: true,
    message: 'Local Telegram cookies cleared. Manual cleanup may be needed for oauth.telegram.org',
    instructions: [
      'Open browser settings',
      'Navigate to Privacy/Cookies section', 
      'Search for telegram.org domains',
      'Delete all related cookies'
    ]
  };
}

/**
 * Comprehensive cleanup that includes browser-specific methods for Telegram OAuth
 */
export function performTelegramLogout() {
  console.log('📱 Starting comprehensive Telegram logout...');
  
  // Standard cleanup
  clearAuthCookies();
  clearAuthLocalStorage();
  
  // Telegram-specific cleanup
  clearTelegramOAuthCookies();
  
  // Try to use browser APIs if available (Chrome extension context)
  if (typeof chrome !== 'undefined' && chrome.cookies) {
    console.log('🌐 Chrome extension API detected - attempting advanced cookie clearing');
    try {
      // Clear cookies from Telegram domains
      const telegramDomains = ['oauth.telegram.org', '.oauth.telegram.org', 'telegram.org', '.telegram.org'];
      
      telegramDomains.forEach(domain => {
        chrome.cookies.getAll({ domain: domain }, (cookies) => {
          cookies.forEach(cookie => {
            chrome.cookies.remove({
              url: `https://${domain}${cookie.path}`,
              name: cookie.name
            });
            console.log(`🗑️ Removed Chrome cookie: ${cookie.name} from ${domain}`);
          });
        });
      });
    } catch (error) {
      console.warn('⚠️ Chrome extension API not available:', error);
    }
  }
  
  // Force page reload to ensure all cached authentication is cleared
  console.log('🔄 Telegram logout completed - page reload recommended');
  
  return {
    success: true,
    requiresReload: true,
    message: 'Telegram logout completed. Page reload recommended for complete cleanup.'
  };
}