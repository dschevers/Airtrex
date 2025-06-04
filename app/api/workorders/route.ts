// app/api/workorders/route.ts
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { getPool } from "../../../lib/db";
import { withAuth } from "../../../lib/auth";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Look for ?active=1 in the URL
    const url = new URL(request.url);
    const activeParam = url.searchParams.get("active"); // “1” or null

    // Base SQL
    let sqlText = `
      SELECT
        WorkOrder,
        Registration,
        Serial,
        Company
      FROM [Work Orders]
      WHERE Company <> 'Eastern Air Express'
    `;

    // If activeParam === "1", add the Active filter
    if (activeParam === "1") {
      sqlText += ` AND Active = 1`;
    }

    sqlText += ` ORDER BY WorkOrder;`;

    const pool = await getPool();
    const { recordset } = await pool.request().query(sqlText);
    return NextResponse.json(recordset);
  } catch (err: any) {
    console.error("Error fetching work orders:", err);
    return NextResponse.json(
      { error: "Failed to load work-orders data" },
      { status: 500 }
    );
  }
});
