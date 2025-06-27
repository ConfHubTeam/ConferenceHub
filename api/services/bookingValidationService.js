/**
 * Booking Validation Service - Centralized validation logic
 */
class BookingValidationService {
  /**
   * Validate booking creation data
   */
  static validateBookingCreation(bookingData) {
    const errors = [];
    
    const {
      place, 
      numOfGuests, 
      totalPrice,
      checkInDate,
      checkOutDate,
      selectedTimeSlots
    } = bookingData;

    // Required fields
    if (!place) errors.push("Place is required");
    if (!numOfGuests || numOfGuests < 1) errors.push("Number of guests must be at least 1");
    if (!totalPrice || totalPrice < 0) errors.push("Total price must be valid");
    
    // Date validation
    if (!checkInDate && (!selectedTimeSlots || selectedTimeSlots.length === 0)) {
      errors.push("Either check-in date or time slots must be provided");
    }

    if (errors.length > 0) {
      const error = new Error(`Validation failed: ${errors.join(', ')}`);
      error.statusCode = 400;
      error.validationErrors = errors;
      throw error;
    }
  }

  /**
   * Validate user permissions for booking operations
   */
  static validateUserPermissions(userType, operation) {
    const permissions = {
      create: ['client'],
      update: ['host', 'agent', 'client'],
      view: ['host', 'agent', 'client'],
      viewAll: ['host', 'agent'],
      viewCompeting: ['host', 'agent'],
      getCounts: ['host', 'agent']
    };

    if (!permissions[operation] || !permissions[operation].includes(userType)) {
      const error = new Error(`User type '${userType}' is not authorized for operation '${operation}'`);
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Validate status transition
   */
  static validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      "pending": ["selected", "approved", "rejected"],
      "selected": ["approved", "rejected"], // Removed pending transition as per requirements
      "approved": [],
      "rejected": [],
      "cancelled": []
    };
    
    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      const error = new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Validate booking status value
   */
  static validateBookingStatus(status) {
    const validStatuses = ['pending', 'selected', 'approved', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Validate time slots format
   */
  static validateTimeSlots(timeSlots) {
    if (!Array.isArray(timeSlots)) {
      const error = new Error("Time slots must be an array");
      error.statusCode = 400;
      throw error;
    }

    for (const slot of timeSlots) {
      if (!slot.date || !slot.startTime || !slot.endTime) {
        const error = new Error("Each time slot must have date, startTime, and endTime");
        error.statusCode = 400;
        throw error;
      }
    }
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    if (pageNum < 1) {
      const error = new Error("Page must be greater than 0");
      error.statusCode = 400;
      throw error;
    }
    
    if (limitNum < 1 || limitNum > 100) {
      const error = new Error("Limit must be between 1 and 100");
      error.statusCode = 400;
      throw error;
    }
    
    return { page: pageNum, limit: limitNum };
  }
}

module.exports = BookingValidationService;
