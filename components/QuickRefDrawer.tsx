"use client";
import { useState, useEffect } from "react";

interface WorkOrderRow {
  WorkOrder: string;
  Registration: string;
  Serial: string;
  Company: string;
}

export default function WorkOrderDrawer() {
  const airtrexGreen = "#009933";
  const airtrexBlue = '#0033cc';
  const [open, setOpen] = useState(false);

  // NEW: keep track of whether we only want Active=true
  const [filterActive, setFilterActive] = useState(false);

  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-fetch whenever `open` or `filterActive` changes
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);

    async function fetchRows() {
      try {
        const url = filterActive ? '/api/workorders?active=1' : '/api/workorders';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as WorkOrderRow[];
        setRows(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load work-orders');
      } finally {
        setLoading(false);
      }
    }

    fetchRows();
  }, [open, filterActive]);

  return (
    <>
          <button onClick={() => setOpen(true)} className="workorders">
            Work Orders
          </button>

          <style jsx global>{`
            .workorders {
              background-color: ${airtrexBlue};
              color: white;
              padding: 0.25rem 1rem;
              border-radius: 9999px;
              font-size: 0.875rem;
              z-index: 50;
            }
            .workorders:hover {
              background-color: ${airtrexGreen};
            }
          `}</style>

      {/* Overlay + slide‐in panel */}
      <div
        className={`
          fixed inset-0 z-60 transition-opacity
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        {/* Semi-transparent backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => {
            setOpen(false);
            setFilterActive(false);
          }}
        />

        {/* Drawer panel */}
        <div
          className={`
            absolute top-1/2 left-1/2 
            transform -translate-x-1/2 -translate-y-1/2
            bg-white shadow-xl rounded-lg
            transition-transform duration-200
            ${open ? "scale-100" : "scale-0"}
            max-w-[90vw] w-auto
            max-h-[90vh] overflow-hidden
          `}
        >
          {/* Header */}
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Work Orders
            </h2>
            <button
              onClick={() => {
                setOpen(false);
                setFilterActive(false);
              }}
              aria-label="Close"
            >
              ❌
            </button>
          </div>

          {/* FILTER BUTTON */}
          <div className="px-4 py-2 border-b flex items-center space-x-2">
            <button
              onClick={() => setFilterActive((prev) => !prev)}
              className={`
                px-3 py-1 rounded 
                ${filterActive
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-800"}
                hover:opacity-90
              `}
            >
              {filterActive ? "Showing Active Only" : "Hide Inactive Work Orders"}
            </button>
            <span className="text-sm text-gray-600">
              {filterActive ? "" : "Showing all work orders"}
            </span>
          </div>

          {/* Table container: scrollable if content > 90vh */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {loading && <p className="text-gray-500">Loading…</p>}
            {error && (
              <p className="text-red-500">{error} (check console for details)</p>
            )}

            {!loading && !error && (
              <table className="table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left whitespace-nowrap text-gray-900">
                      WO#
                    </th>
                    <th className="border px-2 py-1 text-left whitespace-nowrap text-gray-900">
                      Reg
                    </th>
                    <th className="border px-2 py-1 text-left whitespace-nowrap text-gray-900">
                      Serial
                    </th>
                    <th className="border px-2 py-1 text-left whitespace-nowrap text-gray-900">
                      Company
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.WorkOrder}>
                      <td className="border px-2 py-1 whitespace-nowrap text-gray-900">
                        {row.WorkOrder.trim()}
                      </td>
                      <td className="border px-2 py-1 whitespace-nowrap text-gray-900">
                        {row.Registration.trim()}
                      </td>
                      <td className="border px-2 py-1 whitespace-nowrap text-gray-900">
                        {row.Serial.trim()}
                      </td>
                      <td className="border px-2 py-1 whitespace-nowrap text-gray-900">
                        {row.Company.trim()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
