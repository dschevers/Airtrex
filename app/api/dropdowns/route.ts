// app/api/dropdowns/route.ts

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery }          from '../../../lib/db';
import { fallbackData }          from '../../../lib/fallbackData';
import { withAuth }              from '../../../lib/auth';

interface WorkOrder {
  WorkOrder: string;
}

interface Employee {
  EmployeeID: number;
  EmployeeName: string;
}

interface Location {
  LocationID: number;
  Location:   string;
}

interface Unit {
  UnitID:       number;
  UnitOfMeasure: string;
}

export const GET = withAuth(async (_req: NextRequest) => {
  try {
    const [
      workOrdersRes,
      employeesRes,
      locationsRes,
      unitsRes
    ] = await Promise.all([
      executeQuery<WorkOrder>(`
        SELECT WorkOrder
        FROM [dbo].[Work Orders]
        WHERE Active = 1
        ORDER BY WorkOrder
      `),
      executeQuery<Employee>(`
        SELECT EmployeeID, EmployeeName
        FROM [dbo].[EmployeesTemp]
        ORDER BY EmployeeName
      `),
      executeQuery<Location>(`
        SELECT LocationID, Location
        FROM [dbo].[Location]
        ORDER BY Location
      `),
      executeQuery<Unit>(`
        SELECT UnitID, UnitOfMeasure
        FROM [dbo].[UnitOfMeasure]
        ORDER BY UnitOfMeasure
      `),
    ]);

    return NextResponse.json({
      workOrders: workOrdersRes.recordset,
      requesters: employeesRes.recordset,
      locations:  locationsRes.recordset,
      units:      unitsRes.recordset
    });
  } catch (err: unknown) {
    console.error(
      'Error fetching dropdown options:',
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(fallbackData, { status: 500 });
  }
});