// app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, sql } from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';

interface Params {
  params: { id: string };
}

// GET request to fetch a specific order by ID
export const GET = withAuth(
  async (_request: NextRequest, { params }: Params) => {
    try {
      const poNumber = params.id;
      const idNum = parseInt(poNumber, 10);

      if (!poNumber || isNaN(idNum)) {
        return NextResponse.json(
          { error: 'Invalid PO Number' },
          { status: 400 }
        );
      }

      // Get order header
      const orderQuery = `
        SELECT
          po.PONumber,
          po.WorkOrder,
          po.PODate,
          po.POStatus,
          e.EmployeeName AS RequesterName
        FROM PurchaseOrders po
        LEFT JOIN EmployeesTemp e ON po.EmployeeID = e.EmployeeID
        WHERE po.PONumber = @poNumber
      `;

      const orderResult = await executeQuery<{
        PONumber: number;
        WorkOrder: string;
        PODate: Date;
        POStatus: string;
        RequesterName: string;
      }>(orderQuery, [
        { name: 'poNumber', type: sql.Int, value: idNum }
      ]);

      if (orderResult.recordset.length === 0) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Get order items
      const itemsQuery = `
        SELECT
          PartID,
          PartNumber,
          PartDescription AS Description,
          Notes,
          DateRequired AS RequiredByDate,
          Location,
          Quantity,
          UnitOfMeasure
        FROM Parts
        WHERE PONumber = @poNumber
      `;

      const itemsResult = await executeQuery<{
        PartID: number;
        PartNumber: string;
        Description: string;
        Notes: string;
        RequiredByDate: Date;
        Location: string;
        Quantity: number;
        UnitOfMeasure: string;
      }>(itemsQuery, [
        { name: 'poNumber', type: sql.Int, value: idNum }
      ]);

      // Combine order with its items
      const order = {
        ...orderResult.recordset[0],
        lineItems: itemsResult.recordset
      };

      return NextResponse.json(order);
    } catch (err: unknown) {
      // Narrow before logging
      if (err instanceof Error) {
        console.error('Error getting order details:', err.message);
      } else {
        console.error('Error getting order details (non-Error):', err);
      }
      return NextResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    }
  }
);
