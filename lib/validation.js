// lib/validation.js

// Simple sanitizer—strip HTML tags and trim whitespace
export function sanitizeInput(str = '') {
  return String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

// Allowed top-level fields
const TOP_LEVEL_FIELDS = ['workOrder','requesterName','lineItems'];

// Maximum lengths
const MAX_LENGTH = {
  workOrder:      100,
  requesterName:  100,
  description:    255,
  partNumber:     100,
  location:       100,
  unitOfMeasure:  50,
};

// Business limits
const MAX_QUANTITY = 10000;

export function validateOrderData(orderData) {
  const errors = {};

  // 1) Reject unexpected top-level fields
  Object.keys(orderData).forEach(key => {
    if (!TOP_LEVEL_FIELDS.includes(key)) {
      errors[key] = 'Unexpected field';
    }
  });

  // 2) workOrder & requesterName
  ['workOrder','requesterName'].forEach(field => {
    const v = orderData[field];
    if (typeof v !== 'string' || !v.trim()) {
      errors[field] = `${field} is required`;
    } else if (v.length > MAX_LENGTH[field]) {
      errors[field] = `${field} must be under ${MAX_LENGTH[field]} chars`;
    }
  });

  // 3) lineItems
  if (!Array.isArray(orderData.lineItems) || orderData.lineItems.length === 0) {
    errors.lineItems = 'At least one line item is required';
  } else {
    const itemErrors = {};
    orderData.lineItems.forEach((item, i) => {
      const errs = {};
      // allowed keys for each item
      const ALLOWED = ['description','partNumber','notes','requiredByDate','location','quantity','unitOfMeasure'];
      Object.keys(item).forEach(k => {
        if (!ALLOWED.includes(k)) errs[k] = 'Unexpected field';
      });
      // skip fully empty rows
      if (!item.description && !item.partNumber && item.quantity == null) return;
      // string fields
      ['description','partNumber','location','unitOfMeasure'].forEach(fld => {
        const val = item[fld];
        if (typeof val !== 'string' || !val.trim()) {
          errs[fld] = `${fld} is required`;
        } else if (val.length > MAX_LENGTH[fld]) {
          errs[fld] = `${fld} must be under ${MAX_LENGTH[fld]} chars`;
        }
      });
      // quantity
      if (
        item.quantity == null ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_QUANTITY
      ) {
        errs.quantity = `Quantity must be integer 1–${MAX_QUANTITY}`;
      }
      if (Object.keys(errs).length) {
        itemErrors[i] = errs;
      }
    });
    if (Object.keys(itemErrors).length) {
      errors.lineItems = itemErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function sanitizeOrderData(orderData) {
  return {
    workOrder:     sanitizeInput(orderData.workOrder),
    requesterName: sanitizeInput(orderData.requesterName),
    lineItems: orderData.lineItems
      .filter(item =>
        item.description && item.partNumber && Number.isInteger(item.quantity)
      )
      .map(item => ({
        partNumber:      sanitizeInput(item.partNumber),
        description:     sanitizeInput(item.description),
        notes:           sanitizeInput(item.notes || ''),
        requiredByDate:  (() => {
          const d = new Date(item.requiredByDate);
          return isNaN(d) ? null : d.toISOString().split('T')[0];
        })(),
        location:        sanitizeInput(item.location),
        quantity:        Number(item.quantity),
        unitOfMeasure:   sanitizeInput(item.unitOfMeasure)
      }))
  };
}
