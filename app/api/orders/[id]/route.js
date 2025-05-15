// app/api/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '../../../../lib/db';

// GET request to fetch a specific order by ID
export async function GET(request, { params }) {
  try {
    const poNumber = params.id;
    
    if (!poNumber || isNaN(parseInt(poNumber))) {
      return NextResponse.json(
        { error: 'Invalid PO Number' }, 
        { status: 400 }
      );
    }
    
    // Get order header
    const orderQuery = `
      SELECT po.PONumber, po.WorkOrder, po.PODate, po.POStatus, 
             e.EmployeeName as RequesterName
      FROM PurchaseOrders po
      LEFT JOIN EmployeesTemp e ON po.EmployeeID = e.EmployeeID
      WHERE po.PONumber = @poNumber
    `;
    
    const orderResult = await executeQuery(orderQuery, [
      { name: 'poNumber', type: sql.Int, value: parseInt(poNumber) }
    ]);
    
    if (orderResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }
    
    // Get order items
    const itemsQuery = `
      SELECT PartID, PartNumber, PartDescription as Description, Notes,
             DateRequired as RequiredByDate, Location, Quantity, UnitOfMeasure
      FROM Parts
      WHERE PONumber = @poNumber
    `;
    
    const itemsResult = await executeQuery(itemsQuery, [
      { name: 'poNumber', type: sql.Int, value: parseInt(poNumber) }
    ]);
    
    // Combine order with its items
    const order = {
      ...orderResult.recordset[0],
      lineItems: itemsResult.recordset
    };
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error getting order details:', error);
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    );
  }
}