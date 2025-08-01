import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomPhoneInput from "./CustomPhoneInput";
import { isValidPhoneNumber, isPossiblePhoneNumber } from "react-phone-number-input";
import { withTranslationLoading } from "../i18n/hoc/withTranslationLoading";

function EditUserModal({ isOpen, onClose, onSave, user, isSaving }) {
  const { t } = useTranslation("profile");
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: ""
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Initialize form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phoneNumber: user.phoneNumber || ""
      });
      setErrors({});
    }
  }, [user]);

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

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0 && formData.name.trim());
  }, [formData]);

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
