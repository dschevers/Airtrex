/**
 * Simple sanitizer—strip HTML tags and trim whitespace
 */
export function sanitizeInput(str = ''): string {
  return String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

// Allowed top-level fields
const TOP_LEVEL_FIELDS = ['workOrder', 'requesterName', 'lineItems'];

// Maximum lengths for string fields
const MAX_LENGTH: Record<string, number> = {
  workOrder:      100,
  requesterName:  100,
  description:    255,
  partNumber:     100,
  taskNumber:     100,  // Added taskNumber
  notes:          500,  // Added notes to MAX_LENGTH
  location:       100,
  unitOfMeasure:  50,
};

// Business limits
const MAX_QUANTITY = 10000;

/**
 * Raw input structure for line items.
 */
export interface OrderLineItem {
  description?: unknown;
  partNumber?: unknown;
  taskNumber?: unknown;     // Added
  notes?: unknown;
  requiredByDate?: unknown;
  location?: unknown;
  quantity?: unknown;
  unitOfMeasure?: unknown;
  fromStock?: unknown;      // Added
  noAlternates?: unknown;   // Added
  [key: string]: unknown;
}

/**
 * Raw order data from client.
 */
export interface OrderData {
  workOrder?: unknown;
  requesterName?: unknown;
  lineItems?: unknown;
  [key: string]: unknown;
}

/**
 * Validation errors can be top-level (field->message)
 * or per-index for line items (index->(field->message)).
 */
export type ValidationErrors = Record<
  string,
  string | Record<number, Record<string, string>>
>;

/**
 * Result of validating order data.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

/**
 * Validates raw order data and returns any errors found.
 */
export function validateOrderData(
  orderData: OrderData
): ValidationResult {
  const errors: ValidationErrors = {};

  // 1) Reject unexpected top-level fields
  Object.keys(orderData).forEach((key) => {
    if (!TOP_LEVEL_FIELDS.includes(key)) {
      errors[key] = 'Unexpected field';
    }
  });

  // 2) workOrder & requesterName must be non-empty strings
  ['workOrder', 'requesterName'].forEach((field) => {
    const v = orderData[field];
    if (typeof v !== 'string' || !v.trim()) {
      errors[field] = `${field} is required`;
    } else if (v.length > MAX_LENGTH[field]) {
      errors[field] = `${field} must be under ${MAX_LENGTH[field]} chars`;
    }
  });

  // 3) lineItems must be a non-empty array
  const items = orderData.lineItems;
  if (!Array.isArray(items) || items.length === 0) {
    errors.lineItems = 'At least one line item is required';
  } else {
    const itemErrors: Record<number, Record<string, string>> = {};
    items.forEach((itemRaw, i) => {
      const errs: Record<string, string> = {};
      const item = itemRaw as OrderLineItem;
      
      // Allowed keys on each item - added new fields
      const ALLOWED = [
        'description',
        'partNumber',
        'taskNumber',     // Added
        'notes',
        'requiredByDate',
        'location',
        'quantity',
        'unitOfMeasure',
        'fromStock',      // Added
        'noAlternates',   // Added
      ];
      
      Object.keys(item).forEach((k) => {
        if (!ALLOWED.includes(k)) errs[k] = 'Unexpected field';
      });
      
      // Skip fully empty rows
      if (!item.description && !item.partNumber && item.quantity == null) {
        return;
      }
      
      // Validate required string fields
      ['description', 'partNumber', 'location', 'unitOfMeasure'].forEach((fld) => {
        const val = item[fld];
        if (typeof val !== 'string' || !val.trim()) {
          errs[fld] = `${fld} is required`;
        } else if (val.length > (MAX_LENGTH[fld] || 0)) {
          errs[fld] = `${fld} must be under ${MAX_LENGTH[fld]} chars`;
        }
      });
      
      // Validate optional string fields - taskNumber and notes
      ['taskNumber', 'notes'].forEach((fld) => {
        const val = item[fld];
        if (val != null && typeof val === 'string' && val.length > (MAX_LENGTH[fld] || 0)) {
          errs[fld] = `${fld} must be under ${MAX_LENGTH[fld]} chars`;
        }
      });
      
      // Validate boolean fields
      ['fromStock', 'noAlternates'].forEach((fld) => {
        const val = item[fld];
        if (val != null && typeof val !== 'boolean') {
          errs[fld] = `${fld} must be a boolean value`;
        }
      });
      
      // Validate quantity
      const qty = item.quantity;
      if (
        qty == null ||
        typeof qty !== 'number' ||
        !Number.isInteger(qty) ||
        qty < 1 ||
        qty > MAX_QUANTITY
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
    errors,
  };
}

/**
 * Sanitized line item structure.
 */
export interface SanitizedLineItem {
  partNumber: string;
  description: string;
  taskNumber: string;         // Added
  notes: string;
  requiredByDate: string | null;
  location: string;
  quantity: number;
  unitOfMeasure: string;
  fromStock: boolean;         // Added
  noAlternates: boolean;      // Added
}

/**
 * Sanitized order data ready for processing.
 */
export interface SanitizedOrderData {
  workOrder: string;
  requesterName: string;
  lineItems: SanitizedLineItem[];
}

/**
 * Cleans and whitelists raw order data into a known-good shape.
 */
export function sanitizeOrderData(
  orderData: OrderData
): SanitizedOrderData {
  return {
    workOrder: sanitizeInput(orderData.workOrder as string),
    requesterName: sanitizeInput(orderData.requesterName as string),
    lineItems: (Array.isArray(orderData.lineItems)
      ? orderData.lineItems
      : []
    )
      .filter((itemRaw) => {
        const item = itemRaw as OrderLineItem;
        return (
          typeof item.description === 'string' &&
          typeof item.partNumber === 'string' &&
          Number.isInteger(item.quantity as number)
        );
      })
      .map((itemRaw) => {
        const item = itemRaw as OrderLineItem;
        const date = new Date(item.requiredByDate as string);
        return {
          partNumber: sanitizeInput(item.partNumber as string),
          description: sanitizeInput(item.description as string),
          taskNumber: sanitizeInput((item.taskNumber as string) || ''),     // Added
          notes: sanitizeInput((item.notes as string) || ''),
          requiredByDate: isNaN(date.getTime())
            ? null
            : date.toISOString().split('T')[0],
          location: sanitizeInput(item.location as string),
          quantity: Number(item.quantity),
          unitOfMeasure: sanitizeInput(item.unitOfMeasure as string),
          fromStock: Boolean(item.fromStock),                               // Added
          noAlternates: Boolean(item.noAlternates),                         // Added
        };
      }),
  };
}