import { useContext, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import { Navigate, useParams, useLocation } from "react-router-dom";
import api, { getPasswordRequirements, updatePassword } from "../utils/api";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import CustomPhoneInput from "../components/CustomPhoneInput";
import PhoneVerificationModal from "../components/PhoneVerificationModal";
import { isValidPhoneNumber, isPossiblePhoneNumber } from "react-phone-number-input";
import { checkPasswordSpecialChars } from "../utils/formUtils";
import { RiKey2Line, RiEditLine } from "react-icons/ri";
import { performAuthCleanup, clearAuthLocalStorage } from "../utils/cookieUtils";

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
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const accountOptionsRef = useRef(null);
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Phone verification state
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingPhoneUpdate, setPendingPhoneUpdate] = useState(null);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({});
  const [passwordChecklist, setPasswordChecklist] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    validSpecialChars: true
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

  // Fetch password requirements when component mounts
  useEffect(() => {
    const fetchPasswordRequirements = async () => {
      try {
        const requirements = await getPasswordRequirements();
        setPasswordRequirements(requirements);
      } catch (error) {
        console.error("Error fetching password requirements:", error);
      }
    };
    
    fetchPasswordRequirements();
  }, []);
  
  // Update password checklist when new password changes
  useEffect(() => {
    if (newPassword) {
      const specialCharCheck = checkPasswordSpecialChars(newPassword, passwordRequirements.allowedSpecialChars);
      setPasswordChecklist({
        length: newPassword.length >= passwordRequirements.minLength,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /\d/.test(newPassword),
        specialChar: specialCharCheck.hasRequiredSpecialChar,
        validSpecialChars: specialCharCheck.isValid
      });
    } else {
      setPasswordChecklist({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false,
        validSpecialChars: true
      });
    }
  }, [newPassword, passwordRequirements]);

  // Check if passwords match
  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(newPassword === confirmPassword);
    } else {
      setPasswordsMatch(true); // Don't show error for empty confirm password
    }
  }, [newPassword, confirmPassword]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountOptionsRef.current && !accountOptionsRef.current.contains(event.target)) {
        setShowAccountOptions(false);
      }
    }

    if (showAccountOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccountOptions]);

  if (!isReady) {
    return <div className="spacing-container"><p>Loading...</p></div>;
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
      
      // Use utility function to clear all auth data
      performAuthCleanup();
      
      notify(t("profile:messages.logoutSuccess"), "success");
      setRedirect("/");
      setUser(null);
      
      // Dispatch custom event to notify other contexts about logout
      window.dispatchEvent(new CustomEvent("userLoggedOut"));
    } catch (error) {
      notify(t("profile:messages.logoutError"), "error");
      setIsLoggingOut(false);
    }
  }

  async function logoutTelegram() {
    setIsLoggingOut(true);
    try {
      // First log out from Telegram
      const telegramLogoutResponse = await api.post("/telegram-auth/logout");
      
      // Use utility function to clear all auth data
      performAuthCleanup();
      
      notify(
        t("profile:messages.telegramLogoutSuccess", "Successfully logged out from Telegram. You can now login with a different account."), 
        "success"
      );
      setUser(null);
      
      // Dispatch custom event to notify other contexts about logout
      window.dispatchEvent(new CustomEvent("userLoggedOut"));
      
      // Force a page refresh to clear any cached authentication state
      setTimeout(() => {
        window.location.href = "/telegram-auth";
      }, 1000);
      
    } catch (error) {
      console.error("Telegram logout error:", error);
      notify(
        t("profile:messages.telegramLogoutError", "Error logging out from Telegram. Please try again."), 
        "error"
      );
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
    
    // Check if phone number has changed and requires verification
    const phoneChanged = editPhoneNumber.trim() !== (user.phoneNumber || '');
    
    if (phoneChanged && editPhoneNumber.trim()) {
      // Store the pending update and show verification modal
      setPendingPhoneUpdate({
        name: editName.trim(),
        phoneNumber: editPhoneNumber.trim()
      });
      setShowPhoneVerification(true);
      return;
    }
    
    // If no phone change or phone is being removed, proceed with normal update
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
  
  // Handle successful phone verification
  async function handlePhoneVerificationSuccess(updatedUser) {
    setUser(updatedUser);
    if (refreshUserProfile) {
      await refreshUserProfile();
    }
    setIsEditing(false);
    setShowPhoneVerification(false);
    setPendingPhoneUpdate(null);
    notify(t("profile:messages.profileUpdated"), "success");
  }
  
  // Handle phone verification cancellation
  function handlePhoneVerificationCancel() {
    setShowPhoneVerification(false);
    setPendingPhoneUpdate(null);
  }
  
  // Start password change
  function startPasswordChange() {
    setShowPasswordChange(true);
    setNewPassword('');
    setConfirmPassword('');
  }
  
  // Cancel password change
  function cancelPasswordChange() {
    setShowPasswordChange(false);
    setNewPassword('');
    setConfirmPassword('');
  }
  
  // Save new password
  async function savePassword() {
    if (!newPassword || !confirmPassword) {
      notify(t("profile:fields.password.validation.allFieldsRequired"), "error");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      notify(t("profile:fields.password.validation.passwordsDoNotMatch"), "error");
      return;
    }
    
    // Check password requirements
    const allRequirementsMet = Object.values(passwordChecklist).every(Boolean);
    if (!allRequirementsMet) {
      notify(t("profile:fields.password.validation.requirementsNotMet"), "error");
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await updatePassword(newPassword);
      notify(t("profile:messages.passwordUpdated"), "success");
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.code?.startsWith('PASSWORD_')) {
        notify(errorData.error || t("profile:fields.password.validation.invalidPassword"), "error");
      } else {
        notify(errorData?.error || t("profile:messages.passwordUpdateError"), "error");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  }
  
  // Function to delete account
  async function deleteAccount() {
    setIsDeleting(true);
    try {
      await api.delete('/users/account/delete?confirmation=true');
      
      // Clear local storage and cookies
      localStorage.clear();
      performAuthCleanup();
      
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
          bgColor: 'bg-info-50',
          textColor: 'text-info-700'
        };
      case 'agent':
        return {
          label: t("profile:accountTypes.agent.label"),
          description: t("profile:accountTypes.agent.description"),
          icon: '⚙️',
          bgColor: 'bg-secondary/10',
          textColor: 'text-secondary'
        };
      default:
        return {
          label: t("profile:accountTypes.client.label"),
          description: t("profile:accountTypes.client.description"),
          icon: '👤',
          bgColor: 'bg-success-50',
          textColor: 'text-success-700'
        };
    }
  };
  
  const accountInfo = getAccountTypeInfo();

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-6xl mx-auto spacing-container spacing-section">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Account Overview */}
          <div className="lg:col-span-1">
            <div className="card-base spacing-card sticky top-4 sm:top-8">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-primary to-accent-hover rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-heading-3 text-text-primary">{displayName}</h1>
                {user.email && !user.email.includes("telegram_") && (
                  <p className="text-caption text-text-secondary mt-1">{user.email}</p>
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
                <div className="flex justify-between items-center text-caption">
                  <span className="text-text-secondary">{t("profile:sections.overview.memberSince")}</span>
                  <span className="font-medium text-text-primary">
                    {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'short'})}
                  </span>
                </div>
                
                {user.telegramLinked !== undefined && (
                  <div className="flex justify-between items-center text-caption">
                    <span className="text-text-secondary">{t("profile:sections.overview.telegram.status")}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium flex items-center ${user.telegramLinked ? 'text-status-success' : 'text-text-muted'}`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${user.telegramLinked ? 'bg-status-success' : 'bg-text-muted'}`}></div>
                        {user.telegramLinked ? t("profile:sections.overview.telegram.connected") : t("profile:sections.overview.telegram.notConnected")}
                      </span>
                      {user.telegramLinked && (
                        <button
                          onClick={logoutTelegram}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                          disabled={isLoggingOut}
                          title={t("profile:actions.telegramLogoutTooltip", "Logout from Telegram and switch accounts")}
                        >
                          {isLoggingOut ? t("profile:actions.loggingOut") : t("profile:actions.telegramLogout", "Logout")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {user.telegramUsername && (
                  <div className="flex justify-between items-center text-caption">
                    <span className="text-text-secondary">{t("profile:sections.overview.telegram.username")}</span>
                    <span className="font-medium text-text-primary">@{user.telegramUsername}</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={user.telegramLinked ? logoutTelegram : logout} 
                  className="btn-primary btn-size-md w-full flex items-center justify-center space-x-2"
                  disabled={isLoggingOut}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{isLoggingOut ? t("profile:actions.loggingOut") : t("profile:actions.signOut")}</span>
                </button>
                
                {/* Account Options Dropdown */}
                <div className="relative" ref={accountOptionsRef}>
                  <button
                    onClick={() => setShowAccountOptions(!showAccountOptions)}
                    className="w-full bg-bg-secondary text-text-primary py-2 px-3 rounded-lg hover:bg-bg-tertiary transition-colors flex items-center justify-center space-x-2 border border-border-light text-sm"
                    disabled={isDeleting}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{t("profile:actions.accountOptions")}</span>
                    <svg 
                      className={`h-3 w-3 transition-transform duration-200 ${showAccountOptions ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showAccountOptions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border-light rounded-lg shadow-lg py-2 z-10">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(true);
                          setShowAccountOptions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-status-error hover:bg-error-50 transition-colors flex items-center space-x-2"
                        disabled={isDeleting}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>{t("profile:actions.deleteAccount")}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content - Profile Details */}
          <div className="lg:col-span-2">
            <div className="card-base">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border-light">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-heading-3 text-text-primary">{t("profile:sections.profileInfo.title")}</h2>
                    <p className="text-caption text-text-secondary mt-1">{t("profile:sections.profileInfo.subtitle")}</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={startEditing}
                      className="btn-primary btn-size-md flex items-center space-x-2"
                    >
                      <RiEditLine className="h-4 w-4" />
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
                      <label className="form-label">{t("profile:fields.fullName.label")}</label>
                      <div className="text-body text-text-primary bg-bg-secondary px-3 py-2 rounded-lg">
                        {displayName}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="form-label">{t("profile:fields.phoneNumber.label")}</label>
                      <div className="text-body text-text-primary bg-bg-secondary px-3 py-2 rounded-lg">
                        {user.phoneNumber || (
                          <span className="text-text-muted italic">{t("profile:fields.email.notProvided")}</span>
                        )}
                      </div>
                    </div>
                    
                    {user.email && !user.email.includes("telegram_") && (
                      <div className="space-y-1 md:col-span-2">
                        <label className="form-label">{t("profile:fields.email.label")}</label>
                        <div className="text-body text-text-primary bg-bg-secondary px-3 py-2 rounded-lg">
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
                        <label className="form-label">
                          {t("profile:fields.fullName.label")} <span className="text-status-error">*</span>
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="form-input"
                          placeholder={t("profile:fields.fullName.placeholder")}
                          disabled={isSaving}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="form-label">{t("profile:fields.phoneNumber.label")}</label>
                        <CustomPhoneInput
                          value={editPhoneNumber}
                          onChange={setEditPhoneNumber}
                          placeholder={t("profile:fields.phoneNumber.placeholder")}
                          disabled={isSaving}
                        />
                        <p className="text-caption text-text-secondary">
                          {t("profile:fields.phoneNumber.help")}
                        </p>
                      </div>
                      
                      {user.email && !user.email.includes("telegram_") && (
                        <div className="space-y-2 md:col-span-2">
                          <label className="form-label">{t("profile:fields.email.label")}</label>
                          <div className="text-caption text-text-secondary bg-bg-secondary px-3 py-2 rounded-lg border border-border-light">
                            {user.email} <span className="text-text-muted">({t("profile:fields.email.cannotChange")})</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons for edit mode */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border-light">
                      <button
                        onClick={cancelEditing}
                        className="btn-ghost btn-size-md"
                        disabled={isSaving}
                      >
                        {t("profile:actions.cancel")}
                      </button>
                      <button
                        onClick={saveProfile}
                        className="btn-primary btn-size-md flex items-center space-x-2"
                        disabled={isSaving || !editName.trim()}
                      >
                        {isSaving ? (
                          <>
                            <svg className="loading-spinner h-4 w-4" fill="none" viewBox="0 0 24 24">
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
            
            {/* Password Change Section */}
            <div className="card-base mt-6 h-fit">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border-light">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-heading-3 text-text-primary">{t("profile:sections.password.title")}</h2>
                    <p className="text-caption text-text-secondary mt-1">{t("profile:sections.password.subtitle")}</p>
                  </div>
                  {!showPasswordChange && (
                    <button
                      onClick={startPasswordChange}
                      className="btn-primary btn-size-md flex items-center space-x-2"
                    >
                      <RiKey2Line className="h-4 w-4" />
                      <span>{t("profile:actions.changePassword")}</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {!showPasswordChange ? (
                  /* View Mode */
                  <div className="text-center py-3">
                    <div className="w-10 h-10 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-text-secondary text-body">{t("profile:sections.password.description")}</p>
                  </div>
                ) : (
                  /* Password Change Form */
                  <div>
                    <div className="space-y-6">
                      {/* New Password */}
                      <div className="space-y-2">
                        <label className="form-label">
                          {t("profile:fields.password.new")} <span className="text-status-error">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="form-input pr-10"
                            placeholder={t("profile:fields.password.newPlaceholder")}
                            disabled={isUpdatingPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-secondary"
                            disabled={isUpdatingPassword}
                          >
                            {showNewPassword ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m2.122 2.122l-2.122-2.122m0 0l-4.242-4.242M21 12c-1.274-4.057-5.065-7-9.543-7-1.058 0-2.07.169-3.006.484l6.364 6.364z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        {/* Password Requirements */}
                        {newPassword && (
                          <div className="mt-3 p-3 bg-bg-secondary rounded-lg">
                            <p className="text-caption font-medium text-text-primary mb-2">{t("profile:fields.password.requirements")}</p>
                            <div className="space-y-1">
                              <div className={`flex items-center text-caption ${passwordChecklist.length ? 'text-status-success' : 'text-text-muted'}`}>
                                <svg className={`w-3 h-3 mr-2 ${passwordChecklist.length ? 'text-status-success' : 'text-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {t("profile:fields.password.requirement.length", { minLength: passwordRequirements.minLength })}
                              </div>
                              <div className={`flex items-center text-caption ${passwordChecklist.lowercase ? 'text-status-success' : 'text-text-muted'}`}>
                                <svg className={`w-3 h-3 mr-2 ${passwordChecklist.lowercase ? 'text-status-success' : 'text-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {t("profile:fields.password.requirement.lowercase")}
                              </div>
                              <div className={`flex items-center text-caption ${passwordChecklist.uppercase ? 'text-status-success' : 'text-text-muted'}`}>
                                <svg className={`w-3 h-3 mr-2 ${passwordChecklist.uppercase ? 'text-status-success' : 'text-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {t("profile:fields.password.requirement.uppercase")}
                              </div>
                              <div className={`flex items-center text-caption ${passwordChecklist.number ? 'text-status-success' : 'text-text-muted'}`}>
                                <svg className={`w-3 h-3 mr-2 ${passwordChecklist.number ? 'text-status-success' : 'text-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {t("profile:fields.password.requirement.number")}
                              </div>
                              <div className={`flex items-center text-caption ${passwordChecklist.specialChar ? 'text-status-success' : 'text-text-muted'}`}>
                                <svg className={`w-3 h-3 mr-2 ${passwordChecklist.specialChar ? 'text-status-success' : 'text-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {t("profile:fields.password.requirement.specialChar", { allowedChars: passwordRequirements.allowedSpecialChars })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="form-label">
                          {t("profile:fields.password.confirm")} <span className="text-status-error">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-input pr-10"
                            placeholder={t("profile:fields.password.confirmPlaceholder")}
                            disabled={isUpdatingPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-secondary"
                            disabled={isUpdatingPassword}
                          >
                            {showConfirmPassword ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m2.122 2.122l-2.122-2.122m0 0l-4.242-4.242M21 12c-1.274-4.057-5.065-7-9.543-7-1.058 0-2.07.169-3.006.484l6.364 6.364z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        {/* Password Match Indicator */}
                        {confirmPassword && (
                          <div className={`flex items-center text-caption ${passwordsMatch ? 'text-status-success' : 'text-status-error'}`}>
                            <svg className={`w-3 h-3 mr-2 ${passwordsMatch ? 'text-status-success' : 'text-status-error'}`} fill="currentColor" viewBox="0 0 20 20">
                              {passwordsMatch ? (
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              ) : (
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              )}
                            </svg>
                            {passwordsMatch ? t("profile:fields.password.validation.passwordsMatch") : t("profile:fields.password.validation.passwordsDoNotMatch")}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons for password change */}
                    <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-border-light">
                      <button
                        onClick={cancelPasswordChange}
                        className="btn-ghost btn-size-md"
                        disabled={isUpdatingPassword}
                      >
                        {t("profile:actions.cancel")}
                      </button>
                      <button
                        onClick={savePassword}
                        className="btn-primary btn-size-lg flex items-center space-x-2"
                        disabled={isUpdatingPassword || !newPassword || !confirmPassword || !passwordsMatch || !Object.values(passwordChecklist).every(Boolean)}
                      >
                        {isUpdatingPassword ? (
                          <>
                            <svg className="loading-spinner h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t("profile:actions.updatingPassword")}</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t("profile:actions.updatePassword")}</span>
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
      
      {/* Phone verification modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={handlePhoneVerificationCancel}
        onVerificationSuccess={handlePhoneVerificationSuccess}
        phoneNumber={pendingPhoneUpdate?.phoneNumber}
        additionalData={pendingPhoneUpdate ? { name: pendingPhoneUpdate.name } : null}
      />
    </div>
  );
}
