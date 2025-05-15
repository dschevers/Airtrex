import { NextResponse } from 'next/server';
import { executeQuery, sql, getPool } from '../../../lib/db';
import { validateOrderData, sanitizeOrderData } from '../../../lib/validation';

// Handle POST requests (form submissions)
export async function POST(request) {
  try {
    // Get the form data from the request body
    const data = await request.json();
    
    // Log the received data for debugging
    console.log("Received data:", data);
    
    // Validate data
    const validation = validateOrderData(data);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        errors: validation.errors 
      }, { status: 400 });
    }
    
    // Sanitize data
    const sanitizedData = sanitizeOrderData(data);
    
    // Get database connection
    const pool = await getPool();
    
    // Start a transaction for data consistency
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Current date for required fields
      const currentDate = new Date();
      
      // Insert into Mechanic table
      const request = pool.request();
      
      request.input('mechanicName', sql.NVarChar, sanitizedData.requesterName);
      request.input('workOrder', sql.NVarChar, sanitizedData.workOrder);
      request.input('submissionTime', sql.DateTime, currentDate);
      request.input('requestDate', sql.Date, currentDate);
      
      const mechanicResult = await request.query(`
        INSERT INTO Mechanic (
          MechanicName, 
          WorkOrder,
          SubmissionTime, 
          RequestDate
        )
        OUTPUT INSERTED.ID
        VALUES (
          @mechanicName, 
          @workOrder,
          @submissionTime, 
          @requestDate
        )
      `);
      
      // Get the Mechanic ID that was just created
      const mechanicId = mechanicResult.recordset[0].ID;
      
      // Now insert each line item into Parts table
      const insertedItems = [];
      
      for (const item of sanitizedData.lineItems) {
        // Skip empty items
        if (!item.description || !item.partNumber || !item.quantity) {
          continue;
        }
        
        // Create a new request for each item
        const itemRequest = pool.request();
        
        // Add parameters - using location text directly from the client
        itemRequest.input('partNumber', sql.NVarChar, item.partNumber);
        itemRequest.input('partDescription', sql.NVarChar, item.description);
        itemRequest.input('quantity', sql.Int, parseInt(item.quantity));
        itemRequest.input('dateRequired', sql.Date, item.requiredByDate || currentDate);
        itemRequest.input('mechKey', sql.Int, mechanicId);
        itemRequest.input('orderDate', sql.Date, currentDate);
        itemRequest.input('notes', sql.NVarChar, item.notes || '');
        
        // Use the text values directly
        itemRequest.input('location', sql.NVarChar, item.location || '');
        itemRequest.input('unitOfMeasure', sql.NVarChar, item.unitOfMeasure || '');
        
        console.log("Item being inserted:", {
          partNumber: item.partNumber,
          description: item.description,
          location: item.location, // Log for debugging
          unitOfMeasure: item.unitOfMeasure // Log for debugging
        });
        
        // MODIFIED SQL - using Location column
        const insertSQL = `
          INSERT INTO Parts (
            PartNumber, PartDescription, Quantity, 
            DateRequired, MechKey, OrderDate,
            Notes, UnitOfMeasure, Location
          )
          VALUES (
            @partNumber, @partDescription, @quantity, 
            @dateRequired, @mechKey, @orderDate,
            @notes, @unitOfMeasure, @location
          )
        `;
        
        // Execute the query
        await itemRequest.query(insertSQL);
        
        // Add to our tracking array
        insertedItems.push({
          partNumber: item.partNumber,
          description: item.description
        });
      }
      
      // Commit the transaction
      await transaction.commit();
      
      return NextResponse.json({
        success: true,
        message: 'Order submitted successfully',
        mechanicId: mechanicId,
        items: insertedItems
      }, { status: 201 });
      
    } catch (err) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Transaction error:', err);
      return NextResponse.json(
        { error: 'Error creating order: ' + err.message }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    );
  }
}

// Handle GET requests (fetching recent orders)
export async function GET() {
  try {
    const result = await executeQuery(`
      SELECT 
        m.ID as MechanicID, 
        m.MechanicName, 
        m.WorkOrder, 
        m.SubmissionTime,
        m.RequestDate,
        p.OrderID, 
        p.PartNumber, 
        p.PartDescription, 
        p.Quantity,
        p.DateRequired,
        p.OrderDate,
        p.Notes,
        p.UnitOfMeasure,
        p.Location
      FROM Mechanic m
      LEFT JOIN Parts p ON m.ID = p.MechKey
      ORDER BY m.SubmissionTime DESC, p.OrderID DESC
    `);
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Error fetching orders' }, 
      { status: 500 }
    );
  }
}