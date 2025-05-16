// lib/validation.js

// Sanitize input to prevent SQL injection
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove potential SQL injection patterns
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, "") // Remove semicolons
    .replace(/--/g, "") // Remove comment markers
    .replace(/drop|delete|update|insert|select|alter|execute/gi, ""); // Remove SQL keywords
}

// Validate order form data
function validateOrderData(data) {
  const errors = {};
  
  // Validate top-level fields
  if (!data.workOrder) errors.workOrder = "Order Type is required";
  if (!data.requesterName) errors.requesterName = "Requester name is required";
  
  // Validate line items
  if (!data.lineItems || !Array.isArray(data.lineItems) || data.lineItems.length === 0) {
    errors.lineItems = "At least one line item is required";
  } else {
    const itemErrors = {};
    
    data.lineItems.forEach((item) => {
      // Skip validation for empty items
      if (!item.description && !item.partNumber && !item.quantity) {
        return;
      }
      
      if (!item.description) {
        if (!itemErrors.description) itemErrors.description = "Description is required";
      }
      if (!item.partNumber) {
        if (!itemErrors.partNumber) itemErrors.partNumber = "Part/Item number is required";
      }
      if (!item.location) {
        if (!itemErrors.location) itemErrors.location = "Location is required";
      }
      
      // Specific check for quantity
      if (!item.quantity && item.quantity !== 0) {
        if (!itemErrors.quantity) itemErrors.quantity = "Quantity is required";
      } else if (isNaN(parseInt(item.quantity)) || parseInt(item.quantity) <= 0) {
        if (!itemErrors.quantity) itemErrors.quantity = "Quantity must be a positive number";
      }
      
      if (!item.unitOfMeasure) {
        if (!itemErrors.unitOfMeasure) itemErrors.unitOfMeasure = "Unit of measure is required";
      }
    });
    
    if (Object.keys(itemErrors).length > 0) {
      errors.lineItems = itemErrors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Create sanitized copy of order data - updated for your database schema
function sanitizeOrderData(data) {
  return {
    workOrder: sanitizeInput(data.workOrder),
    requesterName: sanitizeInput(data.requesterName),
    lineItems: data.lineItems
      // Filter out empty items
      .filter(item => item.description || item.partNumber || item.quantity)
      // Sanitize each item
      .map(item => ({
        partNumber: sanitizeInput(item.partNumber),
        description: sanitizeInput(item.description),
        notes: sanitizeInput(item.notes),
        requiredByDate: item.requiredByDate,
        location: sanitizeInput(item.location),
        quantity: parseInt(item.quantity),
        unitOfMeasure: sanitizeInput(item.unitOfMeasure)
      }))
  };
}

export {
  sanitizeInput,
  validateOrderData,
  sanitizeOrderData
};