// app/components/page.tsx
'use client';

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';

interface RawComponentRow {
  MechanicID: number;
  MechanicName: string | null;
  WorkOrder: string | null;
  RequestDate: string | null;
  PartNumber: string | null;
  PartDescription: string | null;     // alias for c.Description
  CoreSerial: string | null;
  TaskNumber: string | null;
  NewSerial: string | null;
  Ordered: boolean | null;
  Received: boolean | null;
  CoreReturned: boolean | null;
  DateRequired: string | null;
  ServiceNeeded: string | null;
  Notes: string | null;
  PONumber: number | null;
  Vendor: string | null;
}

type ComponentSortKey =
  | 'PartNumber'
  | 'PartDescription'
  | 'ServiceNeeded'
  | 'CoreSerial'
  | 'Notes'
  | 'NewSerial'
  | 'Vendor'
  | 'PONumber'
  | 'Ordered'
  | 'Received'
  | 'CoreReturned'
  | 'MechanicName'
  | 'WorkOrder'
  | 'DateRequired'
  | 'RequestDate'
  | 'TaskNumber';

export default function ComponentsPage() {
  const [allRows, setAllRows] = useState<RawComponentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    key: ComponentSortKey;
    direction: 'asc' | 'desc';
  } | null>(null);

  // pagination
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 50;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ─── 1) Map row + sortKey → comparable value ──────────────────────────────
  const getValue = (
    row: RawComponentRow,
    key: ComponentSortKey
  ): any => {
    switch (key) {
      case 'PartNumber':
        return (row.PartNumber ?? '').toLowerCase();
      case 'PartDescription':
        return (row.PartDescription ?? '').toLowerCase();
      case 'ServiceNeeded':
        return (row.ServiceNeeded ?? '').toLowerCase();
      case 'CoreSerial':
        return (row.CoreSerial ?? '').toLowerCase();
      case 'Notes':
        return (row.Notes ?? '').toLowerCase();
      case 'NewSerial':
        return (row.NewSerial ?? '').toLowerCase();
      case 'Vendor':
        return (row.Vendor ?? '').toLowerCase();
      case 'PONumber':
        return row.PONumber ?? 0;
      case 'Ordered':
        return row.Ordered === null
          ? -1
          : row.Ordered
          ? 1
          : 0;
      case 'Received':
        return row.Received === null
          ? -1
          : row.Received
          ? 1
          : 0;
      case 'CoreReturned':
        return row.CoreReturned === null
          ? -1
          : row.CoreReturned
          ? 1
          : 0;
      case 'MechanicName':
        return (row.MechanicName ?? '').toLowerCase();
      case 'WorkOrder':
        return (row.WorkOrder ?? '').toLowerCase();
      case 'DateRequired':
        return row.DateRequired
          ? new Date(row.DateRequired).getTime()
          : 0;
      case 'RequestDate':
        return row.RequestDate
          ? new Date(row.RequestDate).getTime()
          : 0;
      case 'TaskNumber':
        return (row.TaskNumber ?? '').toLowerCase();
      default:
        return '';
    }
  };

  // ─── 2) LOAD + default sort by RequestDate DESC ────────────────────────────
  useEffect(() => {
    async function loadAllComponents() {
      try {
        const res = await fetch('/api/components');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data: RawComponentRow[] = await res.json();

        // Sort by RequestDate DESC before storing:
        const byReqDateDesc = data
          .slice()
          .sort((a, b) => {
            const aTs = a.RequestDate
              ? new Date(a.RequestDate).getTime()
              : 0;
            const bTs = b.RequestDate
              ? new Date(b.RequestDate).getTime()
              : 0;
            return bTs - aTs;
          });

        setAllRows(byReqDateDesc);
      } catch (err: any) {
        console.error('Error loading components data:', err);
        setError('Failed to load components data.');
      } finally {
        setLoading(false);
      }
    }
    loadAllComponents();
  }, []);

  // ─── 3) TOGGLE sortConfig ─────────────────────────────────────────────────
  const requestSort = (key: ComponentSortKey) => {
    let newConfig: {
      key: ComponentSortKey;
      direction: 'asc' | 'desc';
    } | null = { key, direction: 'asc' };

    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        newConfig = { key, direction: 'desc' };
      } else {
        newConfig = null; // remove sorting
      }
    }
    setSortConfig(newConfig);
  };

  // ─── 4) DERIVE sortedRows = “allRows sorted by sortConfig (or RequestDate DESC)” ──
  const sortedRows = useMemo<RawComponentRow[]>(() => {
    if (!sortConfig) {
      return allRows
        .slice()
        .sort((a, b) => {
          const aTs = a.RequestDate
            ? new Date(a.RequestDate).getTime()
            : 0;
          const bTs = b.RequestDate
            ? new Date(b.RequestDate).getTime()
            : 0;
          return bTs - aTs;
        });
    }

    const { key, direction } = sortConfig;
    return allRows
      .slice()
      .sort((a, b) => {
        const aVal = getValue(a, key);
        const bVal = getValue(b, key);
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        // tie → fallback to RequestDate DESC
        const aTs = a.RequestDate
          ? new Date(a.RequestDate).getTime()
          : 0;
        const bTs = b.RequestDate
          ? new Date(b.RequestDate).getTime()
          : 0;
        return bTs - aTs;
      });
  }, [allRows, sortConfig]);

  // ─── 5) DERIVE displayRows = “filter out blanks → (text filter → filter) → (else paginate)” ──
  const displayRows = useMemo<RawComponentRow[]>(() => {
    const term = filter.trim().toLowerCase();

    // 5.1) drop rows with no PartNumber, no PartDescription, and no PONumber
    const nonBlank = sortedRows.filter((row) => {
      const noPartNumber =
        !row.PartNumber || row.PartNumber.trim() === '';
      const noDescription =
        !row.PartDescription ||
        row.PartDescription.trim() === '';
      const noPONumber = row.PONumber == null;
      return !(noPartNumber && noDescription && noPONumber);
    });

    // 5.2) If there’s a search term → filter on PartNumber, MechanicName, Vendor, or PONumber
    if (term !== '') {
      return nonBlank.filter((row) => {
        const poStr = (row.PONumber ?? '')
          .toString()
          .toLowerCase();
        const partNum = (row.PartNumber ?? '').toLowerCase();
        const mech = (row.MechanicName ?? '').toLowerCase();
        const vendor = (row.Vendor ?? '').toLowerCase();
        return (
          poStr.includes(term) ||
          partNum.includes(term) ||
          mech.includes(term) ||
          vendor.includes(term)
        );
      });
    }

    // 5.3) Otherwise → paginate the nonBlank array
    return nonBlank.slice(0, pageCount * pageSize);
  }, [filter, sortedRows, pageCount]);

  // ─── 6) “Load more” = bump pageCount for infinite scroll ────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPageCount((prev) => prev + 1);
      setLoadingMore(false);
    }, 200);
  }, [loadingMore]);

  // ─── 7) IntersectionObserver only when filter === '' ────────────────────────
  useEffect(() => {
    if (filter.trim() !== '') return;
    if (!sentinelRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            sortedRows.length > pageCount * pageSize
          ) {
            loadMore();
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '200px',
      }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filter, sortedRows.length, pageCount, loadMore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="text-gray-600">Loading components…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="text-red-500">{error}</span>
      </div>
    );
  }

  // SortIndicator component
  const SortIndicator = ({
    columnKey,
  }: {
    columnKey: ComponentSortKey;
  }) => {
    if (!sortConfig || sortConfig.key !== columnKey)
      return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">
          All Components
        </h1>

        {/* ─── Filter Input ────────────────────────────────────────────────────── */}
        <div className="mb-4">
          <label
            htmlFor="filter"
            className="block text-sm font-medium text-gray-700"
          >
            Search by PO #, Part #, Mechanic, or Vendor
          </label>
          <input
            id="filter"
            type="text"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPageCount(1); // reset pagination on filter change
            }}
            placeholder="Type to filter…"
            className="mt-1 block w-full rounded-md text-gray-700 border-gray-300 shadow-sm
                       focus:border-blue-300 focus:ring focus:ring-blue-200 sm:text-sm p-2"
          />
        </div>

        {/* ─── Table Container ─────────────────────────────────────────────────── */}
        <div className="shadow border border-gray-200 sm:rounded-lg">
          <div
            ref={scrollContainerRef}
            className="bg-white overflow-x-auto overflow-y-auto h-[70vh]"
          >
            <table className="min-w-full table-auto border-collapse">
              {/* ─── Sticky Header ───────────────────────────────────────────────── */}
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  {[
                    // 1. Part Number
                    {
                      label: 'Part Number',
                      key: 'PartNumber' as ComponentSortKey,
                    },
                    // 2. Description
                    {
                      label: 'Description',
                      key: 'PartDescription' as ComponentSortKey,
                    },
                    // 3. Service Needed
                    {
                      label: 'Service Needed',
                      key: 'ServiceNeeded' as ComponentSortKey,
                    },
                    // 4. Vendor
                    {
                      label: 'Vendor',
                      key: 'Vendor' as ComponentSortKey,
                    },
                    // 5. Work Order
                    {
                      label: 'Work Order',
                      key: 'WorkOrder' as ComponentSortKey,
                    },
                    // 6. Ordered
                    {
                      label: 'Ordered',
                      key: 'Ordered' as ComponentSortKey,
                    },
                    // 7. Received
                    {
                      label: 'Received',
                      key: 'Received' as ComponentSortKey,
                    },
                    // 8. Core Returned
                    {
                      label: 'Core Returned',
                      key: 'CoreReturned' as ComponentSortKey,
                    },
                    // 9. Notes
                    {
                      label: 'Notes',
                      key: 'Notes' as ComponentSortKey,
                    },
                    // 10. PO Number
                    {
                      label: 'PO Number',
                      key: 'PONumber' as ComponentSortKey,
                    },
                    // 11. Core Serial
                    {
                      label: 'Core Serial',
                      key: 'CoreSerial' as ComponentSortKey,
                    },
                    // 12. New Serial
                    {
                      label: 'New Serial',
                      key: 'NewSerial' as ComponentSortKey,
                    },
                    // 13. Mechanic Name
                    {
                      label: 'Mechanic Name',
                      key: 'MechanicName' as ComponentSortKey,
                    },
                    // 14. Request Date
                    {
                      label: 'Request Date',
                      key: 'RequestDate' as ComponentSortKey,
                    },
                    // 15. Date Required
                    {
                      label: 'Date Required',
                      key: 'DateRequired' as ComponentSortKey,
                    },
                    // 16. Task Number
                    {
                      label: 'Task Number',
                      key: 'TaskNumber' as ComponentSortKey,
                    },
                  ].map((col, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={
                        col.key
                          ? () => requestSort(col.key)
                          : undefined
                      }
                    >
                      {col.label}
                      {col.key && (
                        <span className="text-gray-500">
                          <SortIndicator columnKey={col.key} />
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ─── Table Body ───────────────────────────────────────────────────── */}
              <tbody className="bg-white divide-y divide-gray-200">
                {displayRows.map((row, idx) => {
                  // 1) Derive display values (text or “Yes”/“No”):
                  const partNum =
                    row.PartNumber ?? '—';
                  const desc =
                    row.PartDescription ?? '—';
                  const service =
                    row.ServiceNeeded ?? '—';
                  const vendor = row.Vendor ?? '—';
                  const work =
                    row.WorkOrder ?? '—';
                  const ordText =
                    row.Ordered ? 'Yes' : 'No';
                  const recText =
                    row.Received ? 'Yes' : 'No';
                  const sentText =
                    row.CoreReturned ? 'Yes' : 'No';
                  const notes = row.Notes ?? '—';
                  const poNum =
                    row.PONumber != null
                      ? row.PONumber
                      : '—';
                  const core =
                    row.CoreSerial ?? '—';
                  const neu = row.NewSerial ?? '—';
                  const mech =
                    row.MechanicName ?? '—';
                  const reqDate = row.RequestDate
                    ? new Date(row.RequestDate).toLocaleDateString()
                    : '—';
                  const dateReq = row.DateRequired
                    ? new Date(row.DateRequired).toLocaleDateString()
                    : '—';
                  const task =
                    row.TaskNumber ?? '—';

                  // 2) Conditional row color:
                  let rowBgClass = '';

                  if (!row.Ordered) {
                    rowBgClass = 'bg-red-100';
                  } else if (
                    row.ServiceNeeded === "Overhaul Exchange" &&
                    row.Ordered &&
                    row.Received
                  ) {
                    // ordered, received, and specifically Overhaul Exchange
                    rowBgClass = 'bg-orange-100';
                  } else if (
                    row.Ordered &&
                    !row.Received
                  ) {
                    rowBgClass = 'bg-yellow-100';
                  } else if (
                    row.Ordered &&
                    row.Received
                  ) {
                    rowBgClass = 'bg-green-100';
                  }

                  // 3) Build array in the NEW column order:
                  const cells = [
                    partNum,    // 1. Part Number
                    desc,       // 2. Description
                    service,    // 3. Service Needed
                    vendor,     // 4. Vendor
                    work,       // 5. Work Order
                    ordText,    // 6. Ordered (Yes/No)
                    recText,    // 7. Received (Yes/No)
                    sentText,   // 8. Core Returned (Yes/No)
                    notes,      // 9. Notes
                    poNum,      // 10. PO Number
                    core,       // 11. Core Serial
                    neu,        // 12. New Serial
                    mech,       // 13. Mechanic Name
                    reqDate,    // 14. Request Date
                    dateReq,    // 15. Date Required
                    task,       // 16. Task Number
                  ];

                  return (
                    <tr
                      key={idx}
                      className={`${rowBgClass} hover:bg-gray-50`}
                    >
                      {cells.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-800"
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Loading‐more row for infinite scroll: */}
                {loadingMore && (
                  <tr>
                    <td
                      colSpan={16}
                      className="py-4 text-center text-gray-600"
                    >
                      Loading more…
                    </td>
                  </tr>
                )}

                {/* Sentinel for IntersectionObserver: */}
                <tr>
                  <td colSpan={16}>
                    <div ref={sentinelRef} />
                  </td>
                </tr>
              </tbody>
            </table>

            {!displayRows.length && !loadingMore && (
              <div className="mt-6 text-center text-gray-500">
                No components match your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
