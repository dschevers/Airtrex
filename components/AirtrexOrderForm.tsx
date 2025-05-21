'use client';

import React, {
  useState,
  useEffect,
  ChangeEvent,
  ReactElement
} from 'react';

//
// ─── TYPES ────────────────────────────────────────────────────────────────────
//

interface WorkOrder { WorkOrder: string; }
interface Requester { EmployeeID: number; EmployeeName: string; }
interface Location  { LocationID: number; Location: string; }
interface Unit      { UnitID: number; UnitOfMeasure: string; }

interface LineItem {
  description:     string;
  partNumber:      string;
  notes:           string;
  requiredByDate:  string;
  locationID:      string;
  quantity:        string;
  unitID:          string;
}

interface FormData {
  workOrder:     string;
  requesterName: string;
  lineItems:     LineItem[];
}

interface DropdownOptions {
  workOrders:  WorkOrder[];
  requesters:  Requester[];
  locations:   Location[];
  units:       Unit[];
}

interface FormErrors {
  workOrder?:     string;
  requesterName?: string;
  lineItems?:     Record<
                   number,
                   Partial<Record<keyof LineItem, string>>
                 >;
}

//
// ─── FALLBACK DATA ─────────────────────────────────────────────────────────────
//

const fallbackData: DropdownOptions = {
  workOrders: [
    { WorkOrder: 'WO10001' },
    { WorkOrder: 'WO10002' },
    { WorkOrder: 'WO10003' },
    { WorkOrder: 'WO10004' }
  ],
  requesters: [
    { EmployeeID: 1, EmployeeName: 'John Smith' },
    { EmployeeID: 2, EmployeeName: 'Jane Doe' },
    { EmployeeID: 3, EmployeeName: 'Mark Johnson' },
    { EmployeeID: 4, EmployeeName: 'Sarah Williams' }
  ],
  locations: [
    { LocationID: 1, Location: 'Warehouse A' },
    { LocationID: 2, Location: 'Office B' },
    { LocationID: 3, Location: 'Production Floor' },
    { LocationID: 4, Location: 'R&D Lab' }
  ],
  units: [
    { UnitID: 1, UnitOfMeasure: 'Each' },
    { UnitID: 2, UnitOfMeasure: 'Box' },
    { UnitID: 3, UnitOfMeasure: 'Case' },
    { UnitID: 4, UnitOfMeasure: 'Pair' },
    { UnitID: 5, UnitOfMeasure: 'Dozen' },
    { UnitID: 6, UnitOfMeasure: 'Pack' },
    { UnitID: 7, UnitOfMeasure: 'Set' }
  ]
};

//
// ─── COMPONENT ─────────────────────────────────────────────────────────────────
//

export default function AirtrexOrderForm(): ReactElement {
  // Brand colors
  const airtrexBlue      = '#0033cc';
  const airtrexGreen     = '#009933';
  const darkTextColor    = '#1F2937';

  // State
  const [formData, setFormData]           = useState<FormData>({
    workOrder:     '',
    requesterName: '',
    lineItems: [
      {
        description:    '',
        partNumber:     '',
        notes:          '',
        requiredByDate: '',
        locationID:     '',
        quantity:       '',
        unitID:         ''
      }
    ]
  });
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);
  const [csrfToken, setCsrfToken]                 = useState<string>('');
  const [showConfirmCancel, setShowConfirmCancel] = useState<boolean>(false);
  const [_activeRows, setActiveRows]               = useState<number>(1);
  const [formErrors, setFormErrors]               = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting]           = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess]         = useState<boolean>(false);
  const [_isLoading, setIsLoading]                 = useState<boolean>(true);
  const [dropdownOptions, setDropdownOptions]     = useState<DropdownOptions>({
    workOrders:  [],
    requesters:  [],
    locations:   [],
    units:       []
  });

  // Fetch CSRF token
  useEffect(() => {
    fetch('/api/auth/csrf', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('CSRF fetch failed');
        return res.json() as Promise<{ csrfToken: string }>;
      })
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => {
        console.error('Could not load CSRF token:', err);
      });
  }, []);

  const isFormUnlocked = Boolean(formData.workOrder && formData.requesterName);

  // Load dropdown data
  useEffect(() => {
    async function loadDropdowns() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/dropdowns', { credentials: 'include' });
        if (res.ok) {
          setDropdownOptions(await res.json());
        } else {
          console.warn("Using fallback data");
          setDropdownOptions(fallbackData);
        }
      } catch {
        console.warn("Using fallback data");
        setDropdownOptions(fallbackData);
      } finally {
        setIsLoading(false);
      }
    }
    loadDropdowns();
  }, []);

  // Auto-add a new line when last row is touched
  useEffect(() => {
    if (!isFormUnlocked) return;
    const last = formData.lineItems[formData.lineItems.length - 1];
    const started = Boolean(
      last.description ||
      last.partNumber  ||
      last.notes       ||
      last.locationID  ||
      last.quantity    ||
      last.unitID
    );
    const emptyRows = formData.lineItems.filter(item =>
      !item.description &&
      !item.partNumber  &&
      !item.locationID  &&
      !item.quantity    &&
      !item.unitID
    ).length;

    if (started && emptyRows === 0) {
      setFormData(prev => ({
        ...prev,
        lineItems: [
          ...prev.lineItems,
          {
            description:    '',
            partNumber:     '',
            notes:          '',
            requiredByDate: '',
            locationID:     '',
            quantity:       '',
            unitID:         ''
          }
        ]
      }));
      setActiveRows(r => r + 1);
    }
  }, [formData.lineItems, isFormUnlocked]);

  // Handle changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement|HTMLSelectElement>,
    index?: number
  ): void => {
    const { name, value } = e.target;
    if (index != null) {
      const items = [...formData.lineItems];
      items[index] = { ...items[index], [name]: value };
      setFormData({ ...formData, lineItems: items });
    } else {
      setFormData({ ...formData, [name]: value } as FormData);
    }
    if (submitSuccess) setSubmitSuccess(false);
  };

  // Basic sanitizer
  const sanitizeInput = (input: string): string =>
    input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/drop|delete|update|insert|select|alter|execute/gi, '');

  // Validate form
  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.workOrder)       errs.workOrder = 'Order Type is required';
    if (!formData.requesterName)   errs.requesterName = 'Requester name is required';

    const itemErrs: FormErrors['lineItems'] = {};
    formData.lineItems.forEach((it, i) => {
      if (!it.description && !it.partNumber && !it.locationID && !it.quantity && !it.unitID) return;
      const rowErr: Partial<Record<keyof LineItem, string>> = {};
      if (!it.description)  rowErr.description    = 'Description is required';
      if (!it.partNumber)   rowErr.partNumber     = 'Part number is required';
      if (!it.locationID)   rowErr.locationID     = 'Location is required';
      if (!it.quantity)     rowErr.quantity       = 'Quantity is required';
      if (!it.unitID)       rowErr.unitID         = 'Unit is required';
      if (Object.keys(rowErr).length) itemErrs[i] = rowErr;
    });
    if (Object.keys(itemErrs).length) errs.lineItems = itemErrs;

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCancel = (): void => {
    setFormData({
      workOrder:     '',
      requesterName: '',
      lineItems: [
        { description:'', partNumber:'', notes:'', requiredByDate:'', locationID:'', quantity:'', unitID:'' }
      ]
    });
    setActiveRows(1);
    setFormErrors({});
  };

  const confirmSubmit = async (): Promise<void> => {
    setShowConfirmSubmit(false);
    if (!validateForm()) {
      alert('Please fix the errors.');
      return;
    }
    setIsSubmitting(true);

    try {
      const submissionData = {
        workOrder:     sanitizeInput(formData.workOrder),
        requesterName: sanitizeInput(formData.requesterName),
        lineItems: formData.lineItems
          .filter(it => it.description && it.partNumber && it.locationID && it.quantity && it.unitID)
          .map(it => {
            const loc = dropdownOptions.locations.find(l => l.LocationID.toString() === it.locationID);
            const uni = dropdownOptions.units.find(u => u.UnitID.toString() === it.unitID);
            return {
              description:    sanitizeInput(it.description),
              partNumber:     sanitizeInput(it.partNumber),
              notes:          sanitizeInput(it.notes),
              requiredByDate: it.requiredByDate || null,
              location:       loc ? loc.Location : '',
              quantity:       Number(it.quantity) || 1,
              unitOfMeasure:  uni ? uni.UnitOfMeasure : ''
            };
          })
      };

      const res = await fetch('/api/orders', {
        method:      'POST',
        credentials: 'include',
        headers:     {
          'Content-Type':  'application/json',
          'X-CSRF-Token':   csrfToken
        },
        body: JSON.stringify(submissionData)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      await res.json();
      setSubmitSuccess(true);
      handleCancel();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Submit error: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateCancel = (): void => {
    const hasData = Boolean(
      formData.workOrder ||
      formData.requesterName ||
      formData.lineItems.some(it =>
        it.description || it.partNumber || it.notes ||
        it.requiredByDate || it.locationID || it.quantity || it.unitID
      )
    );
    if (hasData) setShowConfirmCancel(true);
    else        handleCancel();
  };

  const getCurrentDate = (): string =>
    new Date().toISOString().slice(0, 10);

  const AirtrexLogo = (): ReactElement => (
    <img src="/images/airtrex-logo.png" alt="Airtrex Logo" className="w-40 h-auto mx-auto mb-2" />
  );

  return (
    <div
      className="w-full max-w-4xl mx-auto p-3 sm:p-6 bg-white rounded-lg shadow-lg border-2"
      style={{ borderColor: airtrexBlue }}
    >
      {/* Global styles */}
      <style jsx global>{`
        .airtrex-button { background-color: ${airtrexBlue}; color: white; transition: .2s; }
        .airtrex-button:hover { background-color: ${airtrexGreen}; }
        .airtrex-button:disabled { background-color: #ccc; cursor: not-allowed; }
        .airtrex-cancel-button { transition: .2s; }
        .airtrex-cancel-button:hover { background-color: #f3f4f6; }
      `}</style>

      {/* Header */}
      <div className="mb-4 text-center">
        <AirtrexLogo />
        <h1 className="text-2xl font-bold" style={{ color: airtrexBlue }}>ORDER REQUEST FORM</h1>
      </div>

      {/* Success banner */}
      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded mb-4">
          <strong>Success!</strong> Your request was submitted.
          <button onClick={() => setSubmitSuccess(false)} className="ml-4 airtrex-button px-3 py-1">New Request</button>
        </div>
      )}

      {/* Form */}
      {!submitSuccess && (
        <>
          {/* Top fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Order Type */}
            <div>
              <label className="block mb-1">Order Type</label>
              <select
                name="workOrder"
                value={formData.workOrder}
                onChange={e => handleChange(e)}
                className={`w-full p-2 border ${
                  formErrors.workOrder ? 'border-red-500' : 'border-gray-300'
                } rounded`}
                style={{ color: darkTextColor }}
              >
                <option value="">Select Type</option>
                {dropdownOptions.workOrders.map(o => (
                  <option key={o.WorkOrder} value={o.WorkOrder}>{o.WorkOrder}</option>
                ))}
              </select>
              {formErrors.workOrder && <p className="text-red-500 text-xs">{formErrors.workOrder}</p>}
            </div>

            {/* Requester */}
            <div>
              <label className="block mb-1">Requester Name</label>
              <select
                name="requesterName"
                value={formData.requesterName}
                onChange={e => handleChange(e)}
                className={`w-full p-2 border ${
                  formErrors.requesterName ? 'border-red-500' : 'border-gray-300'
                } rounded`}
                style={{ color: darkTextColor }}
              >
                <option value="">Select Name</option>
                {dropdownOptions.requesters.map(r => (
                  <option key={r.EmployeeID} value={r.EmployeeName}>{r.EmployeeName}</option>
                ))}
              </select>
              {formErrors.requesterName && <p className="text-red-500 text-xs">{formErrors.requesterName}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block mb-1">Date</label>
              <input
                type="date"
                value={getCurrentDate()}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                style={{ color: darkTextColor }}
              />
            </div>
          </div>

          {/* Locked message */}
          {!isFormUnlocked && (
            <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-center">
              Please select both Order Type and Requester Name.
            </div>
          )}

          {/* Buttons top */}
          {isFormUnlocked && (
            <div className="flex space-x-4 mb-6">
              <button
                onClick={initiateCancel}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded border border-gray-300 airtrex-cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded airtrex-button"
              >
                {isSubmitting ? 'Processing…' : 'Submit'}
              </button>
            </div>
          )}

          {/* Line items */}
          {isFormUnlocked && formData.lineItems.map((item, idx) => {
            const rowErrs = formErrors.lineItems?.[idx] || {};
            const hasData = !!(
              item.description ||
              item.partNumber  ||
              item.notes       ||
              item.locationID  ||
              item.quantity    ||
              item.unitID
            );
            return (
              <div key={idx} className="mb-6 p-4 bg-gray-50 border rounded relative">
                {/* Delete button */}
                {hasData && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete Item ${idx+1}?`)) {
                        const copy = [...formData.lineItems];
                        copy.splice(idx,1);
                        if (!copy.length) {
                          copy.push({
                            description:'',partNumber:'',notes:'',requiredByDate:'',locationID:'',quantity:'',unitID:''
                          });
                        }
                        setFormData({ ...formData, lineItems: copy });
                        setActiveRows(r => Math.max(1, r-1));
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                  >✕</button>
                )}

                <h2 className="font-semibold mb-3" style={{ color: airtrexGreen }}>
                  Item {idx + 1}
                </h2>

                {/* Description & Part# */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Description */}
                  <div>
                    <label className="block mb-1">Description</label>
                    <input
                      type="text"
                      name="description"
                      value={item.description}
                      onChange={e => handleChange(e, idx)}
                      className={`w-full p-2 border ${rowErrs.description ? 'border-red-500' : 'border-gray-300'} rounded`}
                      style={{ color: darkTextColor }}
                    />
                    {rowErrs.description && <p className="text-red-500 text-xs">{rowErrs.description}</p>}
                  </div>
                  {/* Part# */}
                  <div>
                    <label className="block mb-1">Part/Item Number</label>
                    <input
                      type="text"
                      name="partNumber"
                      value={item.partNumber}
                      onChange={e => handleChange(e, idx)}
                      className={`w-full p-2 border ${rowErrs.partNumber ? 'border-red-500' : 'border-gray-300'} rounded`}
                      style={{ color: darkTextColor }}
                    />
                    {rowErrs.partNumber && <p className="text-red-500 text-xs">{rowErrs.partNumber}</p>}
                  </div>
                </div>

                {/* Notes & Required Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1">Notes</label>
                    <input
                      type="text"
                      name="notes"
                      value={item.notes}
                      onChange={e => handleChange(e, idx)}
                      className="w-full p-2 border border-gray-300 rounded"
                      style={{ color: darkTextColor }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Required by Date</label>
                    <input
                      type="date"
                      name="requiredByDate"
                      value={item.requiredByDate}
                      onChange={e => handleChange(e, idx)}
                      className="w-full p-2 border border-gray-300 rounded"
                      style={{ color: darkTextColor }}
                    />
                  </div>
                </div>

                {/* Location & Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1">Location</label>
                    <select
                      name="locationID"
                      value={item.locationID}
                      onChange={e => handleChange(e, idx)}
                      className={`w-full p-2 border ${rowErrs.locationID ? 'border-red-500' : 'border-gray-300'} rounded`}
                      style={{ color: darkTextColor }}
                    >
                      <option value="">Select Location</option>
                      {dropdownOptions.locations.map(l => (
                        <option key={l.LocationID} value={l.LocationID}>{l.Location}</option>
                      ))}
                    </select>
                    {rowErrs.locationID && <p className="text-red-500 text-xs">{rowErrs.locationID}</p>}
                  </div>
                  <div>
                    <label className="block mb-1">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={e => handleChange(e, idx)}
                      className={`w-full p-2 border ${rowErrs.quantity ? 'border-red-500' : 'border-gray-300'} rounded`}
                      style={{ color: darkTextColor }}
                      min={1}
                    />
                    {rowErrs.quantity && <p className="text-red-500 text-xs">{rowErrs.quantity}</p>}
                  </div>
                </div>

                {/* Unit of Measure */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Unit of Measure</label>
                    <select
                      name="unitID"
                      value={item.unitID}
                      onChange={e => handleChange(e, idx)}
                      className={`w-full p-2 border ${rowErrs.unitID ? 'border-red-500' : 'border-gray-300'} rounded`}
                      style={{ color: darkTextColor }}
                    >
                      <option value="">Select Unit</option>
                      {dropdownOptions.units.map(u => (
                        <option key={u.UnitID} value={u.UnitID}>{u.UnitOfMeasure}</option>
                      ))}
                    </select>
                    {rowErrs.unitID && <p className="text-red-500 text-xs">{rowErrs.unitID}</p>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Buttons bottom */}
          {isFormUnlocked && (
            <div className="flex space-x-4">
              <button
                onClick={initiateCancel}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded border border-gray-300 airtrex-cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded airtrex-button"
              >
                {isSubmitting ? 'Processing…' : 'Submit'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirm Submission Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h3 className="font-medium mb-4">Confirm Submission</h3>
            <p className="mb-6">Are you sure you want to submit?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowConfirmSubmit(false)} className="px-4 py-2 border rounded airtrex-cancel-button">
                Cancel
              </button>
              <button onClick={confirmSubmit} className="px-4 py-2 rounded airtrex-button">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Modal */}
      {showConfirmCancel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h3 className="font-medium mb-4">Confirm Cancellation</h3>
            <p className="mb-6">All changes will be lost. Continue?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowConfirmCancel(false)} className="px-4 py-2 border rounded airtrex-cancel-button">
                No, Keep Editing
              </button>
              <button onClick={handleCancel} className="px-4 py-2 rounded bg-red-500 text-white">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
