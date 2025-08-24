/**
 * Agent Service
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only agent-related operations
 * - Open/Closed: Extensible for new agent operations
 * - Liskov Substitution: Can be extended with different agent strategies
 * - Interface Segregation: Focused interface for agent operations
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 * 
 * Implements DRY principle by centralizing agent lookup logic
 */

const { User } = require("../models");

class AgentService {
  /**
   * Get all active agents from the system
   * @returns {Promise<Array>} Array of agent users
   */
  static async getAllAgents() {
    try {
      const agents = await User.findAll({
        where: {
          userType: "agent"
        },
        attributes: ["id", "name", "email", "phoneNumber"]
      });

      return agents;
    } catch (error) {
      console.error("Error fetching agents:", error);
      throw new Error(`Failed to fetch agents: ${error.message}`);
    }
  }

  /**
   * Get a single agent (returns first available agent)
   * @returns {Promise<Object|null>} Agent user object or null if no agents found
   */
  static async getAvailableAgent() {
    try {
      const agent = await User.findOne({
        where: {
          userType: "agent"
        },
        attributes: ["id", "name", "email", "phoneNumber"]
      });

      return agent;
    } catch (error) {
      console.error("Error fetching available agent:", error);
      throw new Error(`Failed to fetch available agent: ${error.message}`);
    }
  }

  /**
   * Check if a user is an agent
   * @param {number} userId - User ID to check
   * @returns {Promise<boolean>} True if user is an agent
   */
  static async isAgent(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ["userType"]
      });

      return user && user.userType === "agent";
    } catch (error) {
      console.error("Error checking if user is agent:", error);
      return false;
    }
  }
}

module.exports = AgentService;
