/**
 * User Service - API calls for user management and preferences
 * 
 * Handles:
 * - Language preference updates
 * - User profile management  
 * - Authentication state sync
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Get user's current language preference
 * @returns {Promise<{preferredLanguage: string}>}
 */
export const getLanguagePreference = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/language-preference`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required");
      }
      throw new Error(`Failed to get language preference: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting language preference:", error);
    throw error;
  }
};

/**
 * Update user's language preference
 * @param {string} preferredLanguage - Language code (en, ru, uz)
 * @returns {Promise<{message: string, user: object, preferredLanguage: string}>}
 */
export const updateLanguagePreference = async (preferredLanguage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/language-preference`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ preferredLanguage }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required");
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid language preference");
      }
      throw new Error(`Failed to update language preference: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating language preference:", error);
    throw error;
  }
};

/**
 * Get user profile with language preference
 * @returns {Promise<object>}
 */
export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // User not authenticated
      }
      throw new Error(`Failed to get user profile: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>}
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required");
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update profile");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};
