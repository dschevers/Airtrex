// app/api/orders/route.ts
export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { csrfProtection }        from '../../../lib/csrf-middleware';
import { executeQuery, sql, getPool } from '../../../lib/db';
import { validateOrderData, sanitizeOrderData } from '../../../lib/validation';
import { devLog }               from '../../../lib/logger';
import { withAuth }             from '../../../lib/auth';

//
// ─── POST ──────────────────────────────────────────────────────────────────────
//
export const POST = withAuth(
  csrfProtection(async (request: NextRequest) => {
    // 1) Parse incoming JSON
    const orderData = await request.json();

    // 2) Validate
    const { isValid, errors } = validateOrderData(orderData);
    if (!isValid) {
      devLog('Validation failed:', errors);

      // if the only error is “lineItems” (and it’s a string), return it as plain text
      if (typeof errors.lineItems === 'string') {
        return new NextResponse(errors.lineItems, {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // otherwise fall back to the full JSON error payload
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // 3) Sanitize
    const sanitizedData = sanitizeOrderData(orderData);

    // 4) Insert into DB within a transaction
    const pool        = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const now = new Date();

      // Insert Mechanic row
      const mechReq = pool.request();
      mechReq.input('mechanicName',   sql.NVarChar, sanitizedData.requesterName);
      mechReq.input('workOrder',      sql.NVarChar, sanitizedData.workOrder);
      mechReq.input('submissionTime', sql.DateTime, now);
      mechReq.input('requestDate',    sql.Date,     now);

      const mechResult = await mechReq.query<{ ID: number }>(`
        INSERT INTO Mechanic
          (MechanicName, WorkOrder, SubmissionTime, RequestDate)
        OUTPUT INSERTED.ID
        VALUES (@mechanicName, @workOrder, @submissionTime, @requestDate)
      `);
      const mechanicId = mechResult.recordset[0].ID;

      // Insert each Part row
      const insertedItems: Array<{ partNumber: string; description: string }> = [];
      for (const item of sanitizedData.lineItems) {
        if (!item.description || !item.partNumber || !item.quantity) continue;

        const p = pool.request();
        p.input('partNumber',      sql.NVarChar, item.partNumber);
        p.input('partDescription', sql.NVarChar, item.description);
        p.input('quantity',        sql.Int,      item.quantity);
        p.input('dateRequired',    sql.Date,     item.requiredByDate ?? now);
        p.input('mechKey',         sql.Int,      mechanicId);
        p.input('orderDate',       sql.Date,     now);
        p.input('notes',           sql.NVarChar, item.notes);
        p.input('location',        sql.NVarChar, item.location);
        p.input('unitOfMeasure',   sql.NVarChar, item.unitOfMeasure);

        await p.query(`
          INSERT INTO Parts
            (PartNumber, PartDescription, Quantity, DateRequired,
             MechKey, OrderDate, Notes, UnitOfMeasure, Location)
          VALUES
            (@partNumber, @partDescription, @quantity, @dateRequired,
             @mechKey, @orderDate, @notes, @unitOfMeasure, @location)
        `);

        insertedItems.push({
          partNumber:  item.partNumber,
          description: item.description
        });
      }

      await transaction.commit();

      return NextResponse.json(
        {
          success:    true,
          message:    'Order submitted successfully',
          mechanicId,
          items:      insertedItems
        },
        { status: 201 }
      );

    } catch (err) {
      await transaction.rollback();
      if (err instanceof Error) {
        console.error('Transaction error:', err.message);
        return NextResponse.json(
          { error: 'Error creating order: ' + err.message },
          { status: 500 }
        );
      } else {
        console.error('Transaction error (unknown):', err);
        return NextResponse.json(
          { error: 'Error creating order' },
          { status: 500 }
        );
      }
    }
  })
);

//
// ─── GET ────────────────────────────────────────────────────────────────────────
//
export const GET = withAuth(async (_request: NextRequest) => {
  try {
    const result = await executeQuery<{
      MechanicID:     number;
      MechanicName:   string;
      WorkOrder:      string;
      SubmissionTime: Date;
      RequestDate:    Date;
      OrderID:        number;
      PartNumber:     string;
      PartDescription:string;
      Quantity:       number;
      DateRequired:   Date;
      OrderDate:      Date;
      Notes:          string;
      UnitOfMeasure:  string;
      Location:       string;
    }>(`
      SELECT
        m.ID            AS MechanicID,
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
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error fetching orders:', err.message);
    } else {
      console.error('Error fetching orders (unknown):', err);
    }
    return NextResponse.json(
      { error: 'Error fetching orders' },
      { status: 500 }
    );
  }
});
