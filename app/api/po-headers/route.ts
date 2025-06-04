// app/api/po-headers/route.ts
export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
// ← from "po-headers", go up thrice: po-headers → api → app → (root)
import { executeQuery, sql } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

interface POHeader {
  PONumber: number;
  WorkOrder: string;
  PODate: Date;
  POStatus: string;
  RequesterName: string;
}

export const GET = withAuth(async (_request: NextRequest) => {
  try {
    const result = await executeQuery<{
      MechanicID:     number;
      MechanicName:   string;
      WorkOrder:      string;
      SubmissionTime: Date;
      RequestDate:    Date;
      OrderID:        number;
      PONumber:       number | null;      // ← added
      PartNumber:     string;
      PartDescription:string;
      TaskNumber:     string;
      Quantity:       number;
      DateRequired:   Date;
      OrderDate:      Date;
      Notes:          string;
      UnitOfMeasure:  string;
      Location:       string;
      Ordered:      boolean;
      Received:      boolean;
      FromStock:      boolean;
      NoAlternates:   boolean;
    }>(`
      SELECT
        m.ID            AS MechanicID,
        m.MechanicName,
        m.WorkOrder,
        m.SubmissionTime,
        m.RequestDate,
        p.OrderID,
        p.PONumber,                             -- ← include the real PO Number
        p.PartNumber,
        p.PartDescription,
        p.TaskNumber,
        p.Quantity,
        p.DateRequired,
        p.OrderDate,
        p.Ordered,
        p.Received,
        p.Notes,
        p.UnitOfMeasure,
        p.Location,
        p.FromStock,
        p.NoAlternates
      FROM Mechanic m
      LEFT JOIN Parts p ON m.ID = p.MechKey
      ORDER BY m.SubmissionTime DESC, p.OrderID DESC
    `);

    return NextResponse.json(result.recordset);
  } catch (err) {
    console.error('Error fetching orders:', err);
    return NextResponse.json(
      { error: 'Error fetching orders' },
      { status: 500 }
    );
  }
});
