// app/api/dropdowns/route.js
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../lib/db';
import { fallbackData } from '../../../lib/fallbackData';
import { withAuth } from '../../../lib/auth';

export const GET = withAuth(async () => {
  try {
    // Run all four queries in parallel
    const [ 
      workOrdersRes,
      employeesRes,
      locationsRes,
      unitsRes
    ] = await Promise.all([
      executeQuery(`
        SELECT WorkOrder
        FROM [dbo].[Work Orders]       -- use brackets around names with spaces
        WHERE Active = 1
        ORDER BY WorkOrder
      `),
      executeQuery(`
        SELECT EmployeeID, EmployeeName
        FROM [dbo].[EmployeesTemp]     -- your temp/lookup table
        ORDER BY EmployeeName
      `),
      executeQuery(`
        SELECT LocationID, Location
        FROM [dbo].[Location]
        ORDER BY Location
      `),
      executeQuery(`
        SELECT UnitID, UnitOfMeasure
        FROM [dbo].[UnitOfMeasure]
        ORDER BY UnitOfMeasure
      `),
    ]);

    // Return a JSON response built from the recordsets
    return NextResponse.json({
      workOrders:  workOrdersRes.recordset,
      requesters:  employeesRes.recordset,
      locations:   locationsRes.recordset,
      units:       unitsRes.recordset
    });
  } catch (error) {
    console.error('Error fetching dropdown options:', error.message);
    // You can still return fallback data, optionally with a 500 status
    return NextResponse.json(fallbackData, { status: 500 });
  }
});