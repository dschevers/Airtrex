"use client";
import React, { useState, useEffect } from 'react';

const fallbackData = {
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

export default function AirtrexOrderForm() {
  // Define the Airtrex brand colors
  const airtrexBlue = "#0033cc"; // Matching the logo blue
  const airtrexGreen = "#009933"; // Matching the logo green
  const darkTextColor = "#1F2937"; // Dark gray for better visibility
  
  const [formData, setFormData] = useState({
    workOrder: '',
    requesterName: '',
    lineItems: [
      {
        description: '',
        partNumber: '',
        notes: '',
        requiredByDate: '',
        locationID: '',
        quantity: '',
        unitID: ''
      }
    ]
  });
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [activeRows, setActiveRows] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOptions, setDropdownOptions] = useState({
    workOrders: [],
    requesters: [],
    locations: [],
    units: []
  });

  useEffect(() => {
  fetch('/api/auth/csrf', {
    credentials: 'include'        // ← ensures any cookies are sent/received
  })
    .then(res => {
      if (!res.ok) throw new Error('CSRF fetch failed');
      return res.json();
    })
    .then(data => {
      setCsrfToken(data.csrfToken); 
    })
    .catch(err => {
      console.error('Could not load CSRF token:', err);
      // optionally show an error to the user
    });
}, []);

  // Check if user has selected required fields to unlock the form
  const isFormUnlocked = formData.workOrder && formData.requesterName;

  // Load dropdown data when component mounts
  useEffect(() => {
    async function loadDropdowns() {
      try {
        setIsLoading(true);
        // Try to get data from API
        const response = await fetch('/api/dropdowns');
        
        if (response.ok) {
          const data = await response.json();
          setDropdownOptions(data);
        } else {
          // If API fails, use fallback data
          console.warn("Using fallback data - couldn't connect to database");
          setDropdownOptions(fallbackData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load dropdown options:', error);
        // Use fallback data on error
        setDropdownOptions(fallbackData);
        setIsLoading(false);
      }
    }
    
    loadDropdowns();
  }, []);

  // Check if a new row should be added - only when form is unlocked
  useEffect(() => {
    if (!isFormUnlocked) return;
    
    // Get the last row
    const lastRow = formData.lineItems[formData.lineItems.length - 1];
    
    // If the user is starting to fill out fields on the last row, add another empty row
    const isLastRowStartedFilling = 
      lastRow.description || 
      lastRow.partNumber || 
      lastRow.notes || 
      lastRow.locationID || 
      lastRow.quantity || 
      lastRow.unitID;
    
    // Count empty rows
    const emptyRows = formData.lineItems.filter(item => 
      !item.description && !item.partNumber && !item.locationID && !item.quantity && !item.unitID
    ).length;
    
    // Only add a new row if the last row has started to be filled and we don't have too many empty rows
    if (isLastRowStartedFilling && emptyRows === 0) {
      setFormData(prevData => ({
        ...prevData,
        lineItems: [
          ...prevData.lineItems,
          {
            description: '',
            partNumber: '',
            notes: '',
            requiredByDate: '',
            locationID: '',
            quantity: '',
            unitID: ''
          }
        ]
      }));
      setActiveRows(prevRows => prevRows + 1);
    }
  }, [formData.lineItems, isFormUnlocked]);










const handleChange = (e, index = null) => {
    if (index !== null) {
      // Handle line item changes
      const newLineItems = [...formData.lineItems];
      newLineItems[index] = {
        ...newLineItems[index],
        [e.target.name]: e.target.value
      };
      
      setFormData({
        ...formData,
        lineItems: newLineItems
      });
    } else {
      // Handle top-level form fields
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
    
    // Clear success message if user starts editing again
    if (submitSuccess) {
      setSubmitSuccess(false);
    }
  };

  // Validate input for security
  const sanitizeInput = (input) => {
    // Remove potential SQL injection patterns
    if (typeof input === 'string') {
      // Replace SQL commands and special characters
      return input
        .replace(/'/g, "''") // Escape single quotes
        .replace(/;/g, "") // Remove semicolons
        .replace(/--/g, "") // Remove comment markers
        .replace(/drop|delete|update|insert|select|alter|execute/gi, ""); // Remove SQL keywords
    }
    return input;
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate top level fields
    if (!formData.workOrder) errors.workOrder = "Order Type is required";
    if (!formData.requesterName) errors.requesterName = "Requester name is required";
    
    // Validate line items (excluding empty rows)
    const itemErrors = [];
    formData.lineItems.forEach((item, index) => {
      // Skip empty rows
      if (!item.description && !item.partNumber && !item.locationID && !item.quantity && !item.unitID) {
        return;
      }
      
      const itemError = {};
      if (!item.description) itemError.description = "Description is required";
      if (!item.partNumber) itemError.partNumber = "Part/Item number is required";
      if (!item.locationID) itemError.locationID = "Location is required";
      if (!item.quantity) itemError.quantity = "Quantity is required";
      if (!item.unitID) itemError.unitID = "Unit of measure is required";
      
      // Only add non-empty error objects
      if (Object.keys(itemError).length > 0) {
        itemErrors[index] = itemError;
      }
    });
    
    if (itemErrors.length > 0) errors.lineItems = itemErrors;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleCancel = () => {
    // Reset form to initial state
    setFormData({
      workOrder: '',
      requesterName: '',
      lineItems: [
        {
          description: '',
          partNumber: '',
          notes: '',
          requiredByDate: '',
          locationID: '',
          quantity: '',
          unitID: ''
        }
      ]
    });
    setActiveRows(1);
    setFormErrors({});
  };

  const initiateSubmit = () => {
    setShowConfirmSubmit(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmSubmit(false);
    
    if (!validateForm()) {
      alert("Please fix the errors in the form before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format the data for your API as it expects
      const submissionData = {
        workOrder: formData.workOrder,
        requesterName: formData.requesterName,
        
        // Only include non-empty line items with all required fields
        lineItems: formData.lineItems
          .filter(item => 
            item.description && 
            item.partNumber && 
            item.locationID && 
            item.quantity && 
            item.unitID
          )
          .map(item => {
            // Find location and unit text values by ID
            const location = dropdownOptions.locations.find(
              loc => loc.LocationID.toString() === item.locationID.toString()
            );
            const unit = dropdownOptions.units.find(
              u => u.UnitID.toString() === item.unitID.toString()
            );
            
            // Ensure quantity is a number
            let quantity = parseInt(item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
              quantity = 1; // Default to 1 if quantity is invalid
            }
            
            // Return a clean object with sanitized inputs
            return {
              description: sanitizeInput(item.description),
              partNumber: sanitizeInput(item.partNumber),
              notes: sanitizeInput(item.notes || ''),
              requiredByDate: item.requiredByDate || null,
              location: location ? location.Location : '', // Send location text
              quantity: quantity, // Ensure valid quantity
              unitOfMeasure: unit ? unit.UnitOfMeasure : '' // Send UnitOfMeasure text
            };
          })
      };
      
      // Log the submission data for debugging
      console.log("Submitting data:", JSON.stringify(submissionData, null, 2));
      
      // Submit the order
      const response = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!response.ok) {
        // For non-200 responses, try to read the error
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        try {
          // Try to parse as JSON, but don't fail if it's not JSON
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Failed to submit order');
        } catch (parseError) {
          // If JSON parsing fails, use the raw error text
          throw new Error(`Error: ${response.status} ${response.statusText}. ${errorText}`);
        }
      }
      
      // If we got here, the response was OK
      const result = await response.json();
      
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Reset form after success
      setFormData({
        workOrder: '',
        requesterName: '',
        lineItems: [
          {
            description: '',
            partNumber: '',
            notes: '',
            requiredByDate: '',
            locationID: '',
            quantity: '',
            unitID: ''
          }
        ]
      });
      setActiveRows(1);
      setFormErrors({});
      
    } catch (error) {
      setIsSubmitting(false);
      alert('Error submitting order: ' + error.message);
    }
  };

  const initiateCancel = () => {
    // Only show confirmation if there's data in the form
    const hasData = formData.workOrder || formData.requesterName || 
      formData.lineItems.some(item => 
        item.description || item.partNumber || item.notes || 
        item.requiredByDate || item.locationID || item.quantity || item.unitID
      );
    
    if (hasData) {
      setShowConfirmCancel(true);
    } else {
      // If no data, just cancel without confirmation
      confirmCancel();
    }
  };

  const confirmCancel = () => {
    setShowConfirmCancel(false);
    // Reset form to initial state
    setFormData({
      workOrder: '',
      requesterName: '',
      lineItems: [
        {
          description: '',
          partNumber: '',
          notes: '',
          requiredByDate: '',
          locationID: '',
          quantity: '',
          unitID: ''
        }
      ]
    });
    setActiveRows(1);
    setFormErrors({});
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Logo component using the image file
  const AirtrexLogo = () => (
    <img 
      src="/images/airtrex-logo.png" 
      alt="Airtrex Logo" 
      className="w-40 h-auto mx-auto mb-2" 
    />
  );

return (
  <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 bg-white rounded-lg shadow-lg border-2" style={{ borderColor: airtrexBlue }}>
    {/* Add the button animations CSS */}
    <style jsx global>{`
      /* Button animation */
      .airtrex-button {
        background-color: ${airtrexBlue};
        color: white;
        transition: background-color 0.3s ease, transform 0.1s ease;
      }
      
      .airtrex-button:hover {
        background-color: ${airtrexGreen};
      }
      
      .airtrex-button:active {
        transform: scale(0.98);
      }
      
      /* Add disable state style */
      .airtrex-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      
      /* Make the cancel button also have an animation */
      .airtrex-cancel-button {
        transition: background-color 0.3s ease, transform 0.1s ease;
      }
      
      .airtrex-cancel-button:hover {
        background-color: #f3f4f6;
      }
      
      .airtrex-cancel-button:active {
        transform: scale(0.98);
      }
    `}</style>

    <div className="mb-4 text-center">
      <AirtrexLogo />
      <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6" style={{ color: airtrexBlue }}>
        ORDER REQUEST FORM
      </h1>
    </div>
    
    {submitSuccess ? (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Success!</strong>
        <span className="block sm:inline"> Your order request has been submitted successfully.</span>
        <button 
          onClick={() => setSubmitSuccess(false)} 
          className="px-4 py-2 mt-3 text-white rounded airtrex-button"
        >
          Create Another Request
        </button>
      </div>
    ) : (
      <div>
        {/* Top section with order type, name and date - responsive grid */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
            <select 
              name="workOrder" 
              value={formData.workOrder}
              onChange={handleChange}
              style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
              className={`w-full p-2 border ${formErrors.workOrder ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
            >
              <option value="" style={{ color: darkTextColor }}>Select Type</option>
              {dropdownOptions.workOrders && dropdownOptions.workOrders.map((order) => (
                <option key={order.WorkOrder} value={order.WorkOrder} style={{ color: darkTextColor }}>
                  {order.WorkOrder}
                </option>
              ))}
            </select>
            {formErrors.workOrder && (
              <p className="mt-1 text-xs text-red-500">{formErrors.workOrder}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requester Name</label>
            <select 
              name="requesterName" 
              value={formData.requesterName}
              onChange={handleChange}
              style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
              className={`w-full p-2 border ${formErrors.requesterName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
            >
              <option value="" style={{ color: darkTextColor }}>Select Name</option>
              {dropdownOptions.requesters && dropdownOptions.requesters.map((requester) => (
                <option key={requester.EmployeeID} value={requester.EmployeeName} style={{ color: darkTextColor }}>
                  {requester.EmployeeName}
                </option>
              ))}
            </select>
            {formErrors.requesterName && (
              <p className="mt-1 text-xs text-red-500">{formErrors.requesterName}</p>
            )}
          </div>
          
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
              style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base" 
              value={getCurrentDate()} 
              readOnly
            />
          </div>
        </div>
        
        {/* Show a message if the form is locked */}
        {!isFormUnlocked && (
          <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="text-yellow-700">
              Please select both an Order Type and Requester Name to continue.
            </p>
          </div>
        )}
        
        {/* Only show submit button and line items if form is unlocked */}
        {isFormUnlocked && (
          <>
            {/* Cancel and Submit buttons at top - UPDATED WITH ANIMATION CLASSES */}
            <div className="mt-4 flex space-x-4 mb-6">
              {/* Cancel Button */}
              <button 
                onClick={initiateCancel} 
                disabled={isSubmitting}
                className="w-1/2 text-gray-800 font-medium py-2 px-4 rounded-md border border-gray-300 text-sm sm:text-base airtrex-cancel-button"
              >
                Cancel
              </button>
              {/* Submit Button */}
              <button 
                onClick={initiateSubmit} 
                disabled={isSubmitting}
                className="w-1/2 text-white font-medium py-2 px-4 rounded-md text-sm sm:text-base airtrex-button"
              >
                {isSubmitting ? 'Processing...' : 'Submit'}
              </button>
            </div>
            {/* Line items - each item becomes a section */}
            {formData.lineItems.map((item, index) => {
              // Check if this item has any data entered
              const hasData = item.description || item.partNumber || item.notes || 
                              item.requiredByDate || item.locationID || item.quantity || 
                              item.unitID;
                              
              return (
                <div key={index} className="mb-6 sm:mb-8 p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                  {/* Delete item X button - show for ANY item that has data */}
                  {hasData && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete Item ${index + 1}?`)) {
                          // Remove this specific item
                          const newLineItems = [...formData.lineItems];
                          newLineItems.splice(index, 1);
                          
                          // If we deleted the last item, make sure we have at least one empty item
                          if (newLineItems.length === 0) {
                            newLineItems.push({
                              description: '',
                              partNumber: '',
                              notes: '',
                              requiredByDate: '',
                              locationID: '',
                              quantity: '',
                              unitID: ''
                            });
                          }
                          
                          setFormData({
                            ...formData,
                            lineItems: newLineItems
                          });
                          setActiveRows(prevRows => Math.max(1, prevRows - 1));
                        }
                      }}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white"
                      title={`Delete Item ${index + 1}`}
                    >
                      ✕
                    </button>
                  )}
                  
                  <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: airtrexGreen }}>Item {index + 1}</h2>
                  
                  {/* Rest of the item form fields remain the same */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input 
                        type="text" 
                        name="description"
                        value={item.description}
                        onChange={(e) => handleChange(e, index)}
                        style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
                        className={`w-full p-2 border ${formErrors.lineItems && formErrors.lineItems[index]?.description ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                        placeholder="Enter item description"
                      />
                      {formErrors.lineItems && formErrors.lineItems[index]?.description && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.lineItems[index].description}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Part/Item Number</label>
                      <input 
                        type="text" 
                        name="partNumber"
                        value={item.partNumber}
                        onChange={(e) => handleChange(e, index)}
                        style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
                        className={`w-full p-2 border ${formErrors.lineItems && formErrors.lineItems[index]?.partNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                        placeholder="Enter part number"
                      />
                      {formErrors.lineItems && formErrors.lineItems[index]?.partNumber && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.lineItems[index].partNumber}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Continue with the rest of the item form fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (or include a product link)</label>
                      <input 
                        type="text" 
                        name="notes"
                        value={item.notes}
                        onChange={(e) => handleChange(e, index)}
                        style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        placeholder="Optional notes or link"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Required by Date</label>
                      <input 
                        type="date" 
                        name="requiredByDate"
                        value={item.requiredByDate}
                        onChange={(e) => handleChange(e, index)}
                        style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <select 
                        name="locationID"
                        value={item.locationID || ''}
                        onChange={(e) => handleChange(e, index)}
                        style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
                        className={`w-full p-2 border ${formErrors.lineItems && formErrors.lineItems[index]?.locationID ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                      >
                        <option value="" style={{ color: darkTextColor }}>Select Location</option>
                        {dropdownOptions.locations && dropdownOptions.locations.map((loc) => (
                          <option key={loc.LocationID} value={loc.LocationID} style={{ color: darkTextColor }}>
                            {loc.Location}
                          </option>
                        ))}
                      </select>
                      {formErrors.lineItems && formErrors.lineItems[index]?.locationID && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.lineItems[index].locationID}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input 
                        type="number" 
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleChange(e, index)}
                        style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
                        className={`w-full p-2 border ${formErrors.lineItems && formErrors.lineItems[index]?.quantity ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                        min="1"
                        placeholder="Enter quantity"
                      />
                      {formErrors.lineItems && formErrors.lineItems[index]?.quantity && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.lineItems[index].quantity}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                      <select 
                        name="unitID"
                        value={item.unitID || ''}
                        onChange={(e) => handleChange(e, index)}
                        style={{ color: darkTextColor, borderColor: '#9CA3AF' }}
                        className={`w-full p-2 border ${formErrors.lineItems && formErrors.lineItems[index]?.unitID ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                      >
                        <option value="" style={{ color: darkTextColor }}>Select Unit</option>
                        {dropdownOptions.units && dropdownOptions.units.map((unit) => (
                          <option key={unit.UnitID} value={unit.UnitID} style={{ color: darkTextColor }}>
                            {unit.UnitOfMeasure}
                          </option>
                        ))}
                      </select>
                      {formErrors.lineItems && formErrors.lineItems[index]?.unitID && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.lineItems[index].unitID}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Cancel and Submit buttons at bottom - UPDATED WITH ANIMATION CLASSES */}
            <div className="mt-4 flex space-x-4">
              {/* Cancel Button */}
              <button 
                onClick={initiateCancel}
                disabled={isSubmitting}
                className="w-1/2 text-gray-800 font-medium py-2 px-4 rounded-md border border-gray-300 text-sm sm:text-base airtrex-cancel-button"
              >
                Cancel
              </button>
              {/* Submit Button */}
              <button 
                onClick={initiateSubmit}
                disabled={isSubmitting}
                className="w-1/2 text-white font-medium py-2 px-4 rounded-md text-sm sm:text-base airtrex-button"
              >
                {isSubmitting ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    )}

    {/* Modal components - moved inside the main container */}
    {showConfirmSubmit && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Submission</h3>
          <p className="mb-6 text-gray-700">Are you sure you want to submit this order request?</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirmSubmit(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 airtrex-cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={confirmSubmit}
              className="px-4 py-2 rounded-md text-white airtrex-button"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    )}

    {showConfirmCancel && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Cancellation</h3>
          <p className="mb-6 text-gray-700">Are you sure you want to cancel? All your changes will be lost.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirmCancel(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 airtrex-cancel-button"
            >
              No, Keep Editing
            </button>
            <button
              onClick={confirmCancel}
              className="px-4 py-2 bg-red-500 rounded-md text-white hover:bg-red-600 airtrex-button"
              style={{ backgroundColor: '#cc3300', borderColor: '#cc3300' }}
            >
              Yes, Cancel Form
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}