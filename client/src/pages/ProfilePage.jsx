import { useContext, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import { Navigate, useParams, useLocation } from "react-router-dom";
import api from "../utils/api";
import AccountNav from "../components/AccountNav";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import CustomPhoneInput from "../components/CustomPhoneInput";
import { isValidPhoneNumber, isPossiblePhoneNumber } from "react-phone-number-input";

export default function ProfilePage({}) {
  const [redirect, setRedirect] = useState(); // control the redirect after logout
  const { isReady, user, setUser, refreshUserProfile } = useContext(UserContext); // check the user data loading status
  const { notify } = useNotification();
  const { t } = useTranslation(["profile", "forms"]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const notificationShown = useRef(false);
  
  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Only process notifications once to prevent infinite loops
    if (notificationShown.current) return;
    
    // Check for success/new account flags in URL params
    const searchParams = new URLSearchParams(location.search);
    const loginSuccess = searchParams.get('login_success');
    const newAccount = searchParams.get('new_account');
    
    // Show notifications based on URL parameters
    if (newAccount === 'true') {
      notify(t("profile:messages.accountCreated"), 'success');
      notificationShown.current = true;
    } else if (loginSuccess === 'true') {
      notify(t("profile:messages.loginSuccess"), 'success');
      notificationShown.current = true;
    }
    
    // Clean up URL params after showing notifications
    if (loginSuccess || newAccount) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location.search]); // Only depend on location.search, not the notify function

  if (!isReady) {
    return <div className="px-14"><p>Loading...</p></div>;
  }

  if (isReady && !user && !redirect) {
    // check if user logined
    return <Navigate to={"/login"} />;
  }

  async function logout() {
    setIsLoggingOut(true);
    try {
      // Regular logout
      await api.post("/auth/logout");
      
      // Clear any token or auth data from local storage
      localStorage.removeItem('token');
      localStorage.removeItem('telegram_auth_user_type');
      localStorage.removeItem('telegram_auth_error');
      
      // Clear all cookies by setting their expiration to past date
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      notify(t("profile:messages.logoutSuccess"), "success");
      setRedirect("/");
      setUser(null);
    } catch (error) {
      notify(t("profile:messages.logoutError"), "error");
      setIsLoggingOut(false);
    }
  }

  async function logoutTelegram() {
    setIsLoggingOut(true);
    try {
      // First log out from Telegram
      await api.post("/telegram-auth/logout");
      // Then perform regular logout
      await api.post("/auth/logout");
      
      // Remove any Telegram-related data from local storage
      localStorage.removeItem('telegram_auth_user_type');
      localStorage.removeItem('telegram_auth_error');
      localStorage.removeItem('token');
      
      // Clear all cookies by setting their expiration to past date
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      notify(t("profile:messages.logoutSuccess"), "success");
      setRedirect("/");
      setUser(null);
    } catch (error) {
      notify(t("profile:messages.logoutError"), "error");
      setIsLoggingOut(false);
    }
  }
  
  // Start editing profile
  function startEditing() {
    setEditName(user.telegramLinked && user.telegramFirstName ? user.telegramFirstName : user.name);
    setEditPhoneNumber(user.phoneNumber || '');
    setIsEditing(true);
  }
  
  // Cancel editing
  function cancelEditing() {
    setIsEditing(false);
    setEditName('');
    setEditPhoneNumber('');
  }
  
  // Save profile changes
  async function saveProfile() {
    if (!editName.trim()) {
      notify(t("profile:fields.fullName.required"), "error");
      return;
    }
    
    // Validate phone number if provided
    if (editPhoneNumber && editPhoneNumber.trim()) {
      try {
        if (!isPossiblePhoneNumber(editPhoneNumber)) {
          notify(t("profile:fields.phoneNumber.validation.invalid"), "error");
          return;
        }
        if (!isValidPhoneNumber(editPhoneNumber)) {
          notify(t("profile:fields.phoneNumber.validation.invalidCountry"), "error");
          return;
        }
      } catch (error) {
        notify(t("profile:fields.phoneNumber.validation.invalid"), "error");
        return;
      }
    }
    
    setIsSaving(true);
    try {
      const response = await api.put('/users/profile', {
        name: editName.trim(),
        phoneNumber: editPhoneNumber.trim()
      });
      
      // Update the user context with the new data and refresh profile
      setUser(response.data.user);
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
      setIsEditing(false);
      notify(t("profile:messages.profileUpdated"), "success");
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.code === 'PHONE_NUMBER_EXISTS') {
        notify(t("profile:messages.phoneNumberExists"), "error");
      } else if (errorData?.code === 'INVALID_PHONE_FORMAT') {
        notify(t("profile:messages.invalidPhoneFormat"), "error");
      } else {
        notify(errorData?.error || t("profile:messages.updateError"), "error");
      }
    } finally {
      setIsSaving(false);
    }
  }
  
  // Function to delete account
  async function deleteAccount() {
    setIsDeleting(true);
    try {
      await api.delete('/users/account/delete?confirmation=true');
      
      // Clear local storage and cookies
      localStorage.clear();
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      notify(t("profile:messages.deleteSuccess"), "success");
      setUser(null);
      setRedirect("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      notify(error.response?.data?.error || t("profile:messages.deleteError"), "error");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  // Get display name
  const displayName = user.telegramLinked && user.telegramFirstName ? user.telegramFirstName : user.name;
  
  // Get account type info
  const getAccountTypeInfo = () => {
    switch (user.userType) {
      case 'host':
        return {
          label: t("profile:accountTypes.host.label"),
          description: t("profile:accountTypes.host.description"),
          icon: '🏢',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'agent':
        return {
          label: t("profile:accountTypes.agent.label"),
          description: t("profile:accountTypes.agent.description"),
          icon: '⚙️',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700'
        };
      default:
        return {
          label: t("profile:accountTypes.client.label"),
          description: t("profile:accountTypes.client.description"),
          icon: '👤',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        };
    }
  };
  
  const accountInfo = getAccountTypeInfo();

  return (
    <div className="min-h-screen bg-white">
      <AccountNav />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Account Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                {user.email && !user.email.includes("telegram_") && (
                  <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                )}
              </div>
              
              {/* Account Type Badge */}
              <div className={`${accountInfo.bgColor} ${accountInfo.textColor} rounded-lg p-4 mb-6`}>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{accountInfo.icon}</span>
                  <div>
                    <div className="font-semibold">{accountInfo.label}</div>
                    <div className="text-sm opacity-80">{accountInfo.description}</div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t("profile:sections.overview.memberSince")}</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'short'})}
                  </span>
                </div>
                
                {user.telegramLinked !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{t("profile:sections.overview.telegram.status")}</span>
                    <span className={`font-medium flex items-center ${user.telegramLinked ? 'text-green-600' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${user.telegramLinked ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      {user.telegramLinked ? t("profile:sections.overview.telegram.connected") : t("profile:sections.overview.telegram.notConnected")}
                    </span>
                  </div>
                )}
                
                {user.telegramUsername && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{t("profile:sections.overview.telegram.username")}</span>
                    <span className="font-medium">@{user.telegramUsername}</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={user.telegramLinked ? logoutTelegram : logout} 
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                  disabled={isLoggingOut}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{isLoggingOut ? t("profile:actions.loggingOut") : t("profile:actions.signOut")}</span>
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-orange-50 text-orange-600 py-3 px-4 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center space-x-2 border border-orange-200"
                  disabled={isDeleting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{t("profile:actions.deleteAccount")}</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Content - Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t("profile:sections.profileInfo.title")}</h2>
                    <p className="text-sm text-gray-600 mt-1">{t("profile:sections.profileInfo.subtitle")}</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={startEditing}
                      className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>{t("profile:actions.editProfile")}</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {!isEditing ? (
                  /* View Mode */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">{t("profile:fields.fullName.label")}</label>
                      <div className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {displayName}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">{t("profile:fields.phoneNumber.label")}</label>
                      <div className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {user.phoneNumber || (
                          <span className="text-gray-500 italic">{t("profile:fields.email.notProvided")}</span>
                        )}
                      </div>
                    </div>
                    
                    {user.email && !user.email.includes("telegram_") && (
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">{t("profile:fields.email.label")}</label>
                        <div className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {user.email}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Edit Mode */
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t("profile:fields.fullName.label")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t("profile:fields.fullName.placeholder")}
                          disabled={isSaving}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">{t("profile:fields.phoneNumber.label")}</label>
                        <CustomPhoneInput
                          value={editPhoneNumber}
                          onChange={setEditPhoneNumber}
                          placeholder={t("profile:fields.phoneNumber.placeholder")}
                          disabled={isSaving}
                        />
                        <p className="text-xs text-gray-500">
                          {t("profile:fields.phoneNumber.help")}
                        </p>
                      </div>
                      
                      {user.email && !user.email.includes("telegram_") && (
                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">{t("profile:fields.email.label")}</label>
                          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border">
                            {user.email} <span className="text-gray-400">({t("profile:fields.email.cannotChange")})</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons for edit mode */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        disabled={isSaving}
                      >
                        {t("profile:actions.cancel")}
                      </button>
                      <button
                        onClick={saveProfile}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        disabled={isSaving || !editName.trim()}
                      >
                        {isSaving ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t("profile:actions.saving")}</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t("profile:actions.saveChanges")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete account confirmation modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onDelete={deleteAccount}
        title={t("profile:deleteConfirmation.title")}
        itemToDelete={user}
        itemDetails={[
          { label: t("profile:fields.fullName.label"), value: displayName },
          { label: t("profile:fields.email.label"), value: user?.email && !user?.email.includes("telegram_") ? user?.email : t("profile:fields.email.noEmail") }
        ]}
        consequences={(() => {
          const common = t("profile:deleteConfirmation.consequences.common", { returnObjects: true }) || [];
          const host = user?.userType === 'host' ? (t("profile:deleteConfirmation.consequences.host", { returnObjects: true }) || []) : [];
          const agent = user?.userType === 'agent' ? (t("profile:deleteConfirmation.consequences.agent", { returnObjects: true }) || []) : [];
          
          // Ensure we have arrays and flatten them properly
          const allConsequences = [
            ...(Array.isArray(common) ? common : []),
            ...(Array.isArray(host) ? host : []),
            ...(Array.isArray(agent) ? agent : [])
          ];
          
          return allConsequences;
        })()}
        deleteInProgress={isDeleting}
      />
    </div>
  );
}
