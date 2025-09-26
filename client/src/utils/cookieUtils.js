/**
 * Utility functions for cookie management
 */

/**
 * Clear all authentication-related cookies
 * This function ensures cookies are cleared across different path and domain combinations
 */
export function clearAuthCookies() {
  const cookiesToClear = ['token', 'connect.sid', 'session', 'telegram_auth', 'auth'];
  
  // Clear specific known cookies
  cookiesToClear.forEach(cookieName => {
    // Clear with different path and domain combinations
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  });
  
  // Also clear any remaining cookies
  document.cookie.split(";").forEach(function(c) {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    }
  });
}

/**
 * Clear all local storage items related to authentication
 */
export function clearAuthLocalStorage() {
  const authKeys = ['token', 'telegram_auth_user_type', 'telegram_auth_error'];
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key); // Also clear from session storage
  });
}

/**
 * Perform complete authentication cleanup
 * Clears both cookies and local storage
 */
export function performAuthCleanup() {
  clearAuthCookies();
  clearAuthLocalStorage();
}