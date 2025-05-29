// app/api/orders/[id]/route.ts

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, sql } from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';


interface ParamsShape {
  params: { id: string };
}

// GET request to fetch a specific order by ID
export const GET = withAuth(
  async (
    request: NextRequest,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    // since ApiHandler passes all extra args as unknown[],
    // pick off the first one and assert its shape
    const { params } = args[0] as ParamsShape;
    const poNumber = params.id;
    const idNum    = parseInt(poNumber, 10);

    if (!poNumber || isNaN(idNum)) {
      return NextResponse.json(
        { error: 'Invalid PO Number' },
        { status: 400 }
      );
    }
    try {
      const orderResult = await executeQuery<{
        PONumber: number;
        WorkOrder: string;
        PODate: Date;
        POStatus: string;
        RequesterName: string;
      }>(
        `SELECT
           po.PONumber,
           po.WorkOrder,
           po.PODate,
           po.POStatus,
           e.EmployeeName AS RequesterName
         FROM PurchaseOrders po
         LEFT JOIN EmployeesTemp e ON po.EmployeeID = e.EmployeeID
         WHERE po.PONumber = @poNumber`,
        [{ name: 'poNumber', type: sql.Int, value: idNum }]
      );

      if (orderResult.recordset.length === 0) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      const itemsResult = await executeQuery<{
        PartID: number;
        PartNumber: string;
        Description: string;
        TaskNumber: string;      // Added
        Notes: string;
        RequiredByDate: Date;
        Location: string;
        Quantity: number;
        UnitOfMeasure: string;
        FromStock: boolean;      // Added
        NoAlternates: boolean;   // Added
      }>(
        `SELECT
           PartID,
           PartNumber,
           PartDescription AS Description,
           TaskNumber,
           Notes,
           DateRequired AS RequiredByDate,
           Location,
           Quantity,
           UnitOfMeasure,
           FromStock,
           NoAlternates
         FROM Parts
         WHERE PONumber = @poNumber`,
        [{ name: 'poNumber', type: sql.Int, value: idNum }]
      );

      return NextResponse.json({
        ...orderResult.recordset[0],
        lineItems: itemsResult.recordset,
      });
    } catch (err: unknown) {
      console.error(
        'Error getting order details:',
        err instanceof Error ? err.message : err
      );
      return NextResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    }
  }
);