// app/api/components/route.ts
export const runtime = 'nodejs';

import { NextResponse, NextRequest }          from 'next/server';
//import { csrfProtection }                     from '../../../lib/csrf-middleware';
import { executeQuery, sql, getPool }         from '../../../lib/db';
//import { validateOrderData, sanitizeOrderData } from '../../../lib/validation';
//import { devLog }                             from '../../../lib/logger';
import { withAuth }                           from '../../../lib/auth';

//
// ─── GET ────────────────────────────────────────────────────────────────────────
//

export const GET = withAuth(async (_request: NextRequest) => {
  try {
    // We use the same executeQuery helper as in orders/route.ts,
    // but swap out the SQL for the Components JOIN.
    const result = await executeQuery<{
      MechanicID:           number;
      MechanicName:         string;
      WorkOrder:            string;
      RequestDate:          Date;
      PartNumber:           string;
      PartDescription:      string;  // alias for c.Description
      CoreSerial:           string;
      CoreReturned:         boolean;
      TaskNumber:           string;
      NewSerial:            string;
      Ordered:              boolean;
      Received:             boolean;
      OrderDate:            Date;
      DateRequired:         Date;
      Price:                number;
      ServiceNeeded:        string;
      Notes:                string;
      Billbacks:            number;
      PONumber:             number;
      NoAlternates:         boolean;
      Vendor:               string;
      Total:                number;
      ServiceableAcceptable:boolean;
    }>(`
      SELECT
        m.ID                            AS MechanicID,
        m.MechanicName                  AS MechanicName,
        m.WorkOrder                     AS WorkOrder,
        m.RequestDate                   AS RequestDate,
        c.PartNumber                    AS PartNumber,
        c.Description                   AS PartDescription,
        c.CoreSerial                    AS CoreSerial,
        c.TaskNumber                    AS TaskNumber,
        c.NewSerial                     AS NewSerial,
        c.Ordered                       AS Ordered,
        c.Received                      AS Received,
        c.CoreReturned                  AS CoreReturned,
        c.OrderDate                     AS OrderDate,
        c.DateRequired                  AS DateRequired,
        c.Price                         AS Price,
        c.ServiceNeeded                 AS ServiceNeeded,
        c.Notes                         AS Notes,
        c.Billbacks                     AS Billbacks,
        c.PONumber                      AS PONumber,
        c.NoAlternates                  AS NoAlternates,
        c.Vendor                        AS Vendor,
        c.Total                         AS Total,
        c.ServiceableAcceptable         AS ServiceableAcceptable
      FROM dbo.Mechanic AS m
      INNER JOIN dbo.Components AS c
        ON m.ID = c.MechKey
      ORDER BY
        m.RequestDate DESC,
        c.OrderDate   DESC
    `);

    return NextResponse.json(result.recordset);
  } catch (err: any) {
    console.error('Error fetching components:', err.message || err);
    return NextResponse.json(
      { error: 'Error fetching components' },
      { status: 500 }
    );
  }
});