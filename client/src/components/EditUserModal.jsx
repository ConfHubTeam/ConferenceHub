import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomPhoneInput from "./CustomPhoneInput";
import { isValidPhoneNumber, isPossiblePhoneNumber } from "react-phone-number-input";
import { withTranslationLoading } from "../i18n/hoc/withTranslationLoading";
import { getPasswordRequirements } from "../utils/api";
import { checkPasswordSpecialChars } from "../utils/formUtils";
import { RiEyeLine, RiEyeOffLine, RiKey2Line } from "react-icons/ri";

function EditUserModal({ isOpen, onClose, onSave, user, isSaving }) {
  const { t } = useTranslation("profile");
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Initialize form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phoneNumber: user.phoneNumber || "",
        newPassword: "",
        confirmPassword: ""
      });
      setErrors({});
      setShowPasswordSection(false); // Reset password section when user changes
    }
  }, [user]);

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
    if (formData.newPassword) {
      const specialCharCheck = checkPasswordSpecialChars(formData.newPassword, passwordRequirements.allowedSpecialChars);
      setPasswordChecklist({
        length: formData.newPassword.length >= passwordRequirements.minLength,
        uppercase: /[A-Z]/.test(formData.newPassword),
        lowercase: /[a-z]/.test(formData.newPassword),
        number: /\d/.test(formData.newPassword),
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
  }, [formData.newPassword, passwordRequirements]);

  // Check if passwords match
  useEffect(() => {
    if (formData.confirmPassword) {
      setPasswordsMatch(formData.newPassword === formData.confirmPassword);
    } else {
      setPasswordsMatch(true); // Don't show error for empty confirm password
    }
  }, [formData.newPassword, formData.confirmPassword]);

  // Validate form whenever form data changes
  useEffect(() => {
    const newErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = t("fields.fullName.required");
    }

    // Validate phone number if provided
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      try {
        // Check if phone number is valid for the selected country
        if (!isPossiblePhoneNumber(formData.phoneNumber)) {
          newErrors.phoneNumber = t("fields.phoneNumber.validation.invalid");
        } else if (!isValidPhoneNumber(formData.phoneNumber)) {
          newErrors.phoneNumber = t("fields.phoneNumber.validation.invalidCountry");
        }
      } catch (error) {
        newErrors.phoneNumber = t("fields.phoneNumber.validation.invalid");
      }
    }

    // Validate password fields if new password is provided OR if password section is shown
    if (showPasswordSection) {
      if (formData.newPassword) {
        // Check password requirements
        const allRequirementsMet = Object.values(passwordChecklist).every(Boolean);
        if (!allRequirementsMet) {
          newErrors.newPassword = t("fields.password.validation.requirementsNotMet");
        }

        // Check if confirm password is provided
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = t("fields.password.validation.confirmRequired");
        } else if (!passwordsMatch) {
          newErrors.confirmPassword = t("fields.password.validation.passwordsDoNotMatch");
        }
      }
      // If password section is shown but no password provided, it's optional
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0 && formData.name.trim());
  }, [formData, passwordChecklist, passwordsMatch, showPasswordSection, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (value) => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid && !isSaving) {
      onSave(formData);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const getUserTypeClass = (userType) => {
    switch(userType) {
      case "host": return "bg-green-100 text-green-800";
      case "agent": return "bg-purple-100 text-purple-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t("editModal.title")}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">{t("editModal.userId", { id: user.id })}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${getUserTypeClass(user.userType)}`}>
                {t(`editModal.userType.${user.userType}`, user.userType.charAt(0).toUpperCase() + user.userType.slice(1))}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("fields.email.label")}
              </label>
              <input
                type="email"
                value={user.email || t("fields.email.noEmail")}
                disabled
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">{t("fields.email.cannotChange")}</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("fields.fullName.label")} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSaving}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
                  errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder={t("fields.fullName.placeholder")}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("fields.phoneNumber.label")}
              </label>
              <CustomPhoneInput
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                disabled={isSaving}
                className={`w-full ${errors.phoneNumber ? "border-red-300" : ""}`}
                placeholder={t("fields.phoneNumber.placeholder")}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t("fields.phoneNumber.help")}
              </p>
            </div>

            {/* Password Section Toggle */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {t("editModal.passwordSection.title")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(!showPasswordSection);
                    if (!showPasswordSection) {
                      // Reset password fields when hiding section
                      setFormData(prev => ({
                        ...prev,
                        newPassword: "",
                        confirmPassword: ""
                      }));
                    }
                  }}
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                >
                  <RiKey2Line className="w-4 h-4" />
                  <span className="text-sm">
                    {showPasswordSection ? t("editModal.passwordSection.hide") : t("editModal.passwordSection.show")}
                  </span>
                </button>
              </div>

              {/* Password Fields - Conditional Rendering */}
              {showPasswordSection && (
                <div className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.password.new")}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
                          errors.newPassword ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                        }`}
                        placeholder={t("fields.password.newPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isSaving}
                      >
                        {showNewPassword ? (
                          <RiEyeOffLine className="w-5 h-5" />
                        ) : (
                          <RiEyeLine className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
                    )}
                    
                    {/* Password Requirements */}
                    {formData.newPassword && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">{t("fields.password.requirements")}</p>
                        <div className="space-y-1">
                          <div className={`flex items-center text-xs ${passwordChecklist.length ? 'text-success-600' : 'text-gray-500'}`}>
                            <svg className={`w-3 h-3 mr-2 ${passwordChecklist.length ? 'text-success-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t("fields.password.requirement.length", { minLength: passwordRequirements.minLength })}
                          </div>
                          <div className={`flex items-center text-xs ${passwordChecklist.lowercase ? 'text-success-600' : 'text-gray-500'}`}>
                            <svg className={`w-3 h-3 mr-2 ${passwordChecklist.lowercase ? 'text-success-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t("fields.password.requirement.lowercase")}
                          </div>
                          <div className={`flex items-center text-xs ${passwordChecklist.uppercase ? 'text-success-600' : 'text-gray-500'}`}>
                            <svg className={`w-3 h-3 mr-2 ${passwordChecklist.uppercase ? 'text-success-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t("fields.password.requirement.uppercase")}
                          </div>
                          <div className={`flex items-center text-xs ${passwordChecklist.number ? 'text-success-600' : 'text-gray-500'}`}>
                            <svg className={`w-3 h-3 mr-2 ${passwordChecklist.number ? 'text-success-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t("fields.password.requirement.number")}
                          </div>
                          <div className={`flex items-center text-xs ${passwordChecklist.specialChar ? 'text-success-600' : 'text-gray-500'}`}>
                            <svg className={`w-3 h-3 mr-2 ${passwordChecklist.specialChar ? 'text-success-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t("fields.password.requirement.specialChar", { allowedChars: passwordRequirements.allowedSpecialChars })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.password.confirm")}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
                          errors.confirmPassword ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                        }`}
                        placeholder={t("fields.password.confirmPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isSaving}
                      >
                        {showConfirmPassword ? (
                          <RiEyeOffLine className="w-5 h-5" />
                        ) : (
                          <RiEyeLine className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                    )}
                    
                    {/* Password Match Indicator */}
                    {formData.confirmPassword && (
                      <div className={`flex items-center text-xs mt-2 ${passwordsMatch ? 'text-success-600' : 'text-error-600'}`}>
                        <svg className={`w-3 h-3 mr-2 ${passwordsMatch ? 'text-success-500' : 'text-error-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          {passwordsMatch ? (
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                        {passwordsMatch ? t("fields.password.validation.passwordsMatch") : t("fields.password.validation.passwordsDoNotMatch")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {t("actions.cancel")}
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t("actions.saving")}
                </>
              ) : (
                t("actions.saveChanges")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withTranslationLoading(EditUserModal, ["profile"]);
