/**
 * Language Settings Controller
 * Handles user language preference updates for SMS notifications
 */

const { User } = require("../models");

class LanguageController {
  /**
   * Update user's preferred language
   * POST /api/user/language
   */
  static async updateUserLanguage(req, res) {
    try {
      const { language } = req.body;
      const userId = req.user.id; // From auth middleware

      // Validate language
      const supportedLanguages = ["en", "ru", "uz"];
      if (!language || !supportedLanguages.includes(language)) {
        return res.status(400).json({
          success: false,
          message: "Invalid language. Supported languages: en, ru, uz"
        });
      }

      // Update user's preferred language
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      await user.update({
        preferredLanguage: language
      });

      res.json({
        success: true,
        message: "Language preference updated successfully",
        data: {
          userId: user.id,
          preferredLanguage: language
        }
      });

    } catch (error) {
      console.error("Error updating user language:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update language preference",
        error: error.message
      });
    }
  }

  /**
   * Get user's current language preference
   * GET /api/user/language
   */
  static async getUserLanguage(req, res) {
    try {
      const userId = req.user.id; // From auth middleware

      const user = await User.findByPk(userId, {
        attributes: ["id", "preferredLanguage"]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          preferredLanguage: user.preferredLanguage || "ru",
          availableLanguages: [
            { code: "ru", name: "Russian", nativeName: "Русский" },
            { code: "en", name: "English", nativeName: "English" },
            { code: "uz", name: "Uzbek", nativeName: "O'zbek" }
          ]
        }
      });

    } catch (error) {
      console.error("Error getting user language:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get language preference",
        error: error.message
      });
    }
  }
}

module.exports = LanguageController;
