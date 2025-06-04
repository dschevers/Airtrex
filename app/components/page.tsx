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
  DateRequired: string | null;
  Price: number | null;
  ServiceNeeded: string | null;
  Notes: string | null;
  Billbacks: number | null;
  PONumber: number | null;
  Vendor: string | null;
  ServiceableAcceptable: boolean | null;
}

type ComponentSortKey =
  | 'PartNumber'
  | 'PartDescription'
  | 'ServiceNeeded'
  | 'CoreSerial'
  | 'Notes'
  | 'NewSerial'
  | 'Vendor'
  | 'Price'
  | 'Billbacks'
  | 'PONumber'
  | 'Ordered'
  | 'Received'
  | 'ServiceableAcceptable'
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
      case 'Price':
        return row.Price ?? 0;
      case 'Billbacks':
        return row.Billbacks ?? 0;
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
      case 'ServiceableAcceptable':
        return row.ServiceableAcceptable === null
          ? -1
          : row.ServiceableAcceptable
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
                    {
                      label: 'PartNumber',
                      key: 'PartNumber' as ComponentSortKey,
                    },
                    {
                      label: 'Description',
                      key:
                        'PartDescription' as ComponentSortKey,
                    },
                    {
                      label: 'ServiceNeeded',
                      key: 'ServiceNeeded' as ComponentSortKey,
                    },
                    {
                      label: 'CoreSerial',
                      key: 'CoreSerial' as ComponentSortKey,
                    },
                    { label: 'Notes', key: 'Notes' as ComponentSortKey },
                    {
                      label: 'NewSerial',
                      key: 'NewSerial' as ComponentSortKey,
                    },
                    { label: 'Vendor', key: 'Vendor' as ComponentSortKey },
                    { label: 'Price', key: 'Price' as ComponentSortKey },
                    {
                      label: 'Billbacks',
                      key: 'Billbacks' as ComponentSortKey,
                    },
                    {
                      label: 'PONumber',
                      key: 'PONumber' as ComponentSortKey,
                    },
                    {
                      // “Ordered” header
                      label: 'Ordered',
                      key: 'Ordered' as ComponentSortKey,
                    },
                    {
                      // “Received” header
                      label: 'Received',
                      key: 'Received' as ComponentSortKey,
                    },
                    {
                      // “Service OK?” header
                      label: 'Svc OK?',
                      key:
                        'ServiceableAcceptable' as ComponentSortKey,
                    },
                    {
                      label: 'MechanicName',
                      key:
                        'MechanicName' as ComponentSortKey,
                    },
                    {
                      label: 'WorkOrder',
                      key: 'WorkOrder' as ComponentSortKey,
                    },
                    {
                      label: 'DateRequired',
                      key:
                        'DateRequired' as ComponentSortKey,
                    },
                    {
                      label: 'RequestDate',
                      key:
                        'RequestDate' as ComponentSortKey,
                    },
                    {
                      label: 'TaskNumber',
                      key:
                        'TaskNumber' as ComponentSortKey,
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
                  // 1) Text or boolean (as “Yes”/“No”) for each column in order:
                  const partNum =
                    row.PartNumber ?? '—';
                  const desc =
                    row.PartDescription ?? '—';
                  const service =
                    row.ServiceNeeded ?? '—';
                  const core =
                    row.CoreSerial ?? '—';
                  const notes = row.Notes ?? '—';
                  const neu = row.NewSerial ?? '—';
                  const vendor = row.Vendor ?? '—';
                  const price =
                    row.Price != null
                      ? row.Price.toFixed(2)
                      : '—';
                  const bill =
                    row.Billbacks != null
                      ? row.Billbacks.toFixed(2)
                      : '—';
                  const poNum =
                    row.PONumber != null
                      ? row.PONumber
                      : '—';
                  const ordText =
                    row.Ordered ? 'Yes' : 'No';
                  const recText =
                    row.Received ? 'Yes' : 'No';
                  const svcOkText =
                    row.ServiceableAcceptable
                      ? 'Yes'
                      : 'No';
                  const mech =
                    row.MechanicName ?? '—';
                  const work =
                    row.WorkOrder ?? '—';
                  const dateReq = row.DateRequired
                    ? new Date(row.DateRequired).toLocaleDateString()
                    : '—';
                  const reqDate = row.RequestDate
                    ? new Date(row.RequestDate).toLocaleDateString()
                    : '—';
                  const task =
                    row.TaskNumber ?? '—';

                  // 2) Conditional row color:
                  let rowBgClass = '';
                  if (!row.Ordered) {
                    // never ordered → RED
                    rowBgClass = 'bg-red-100';
                  } else if (
                    row.Ordered &&
                    !row.ServiceableAcceptable
                  ) {
                    // ordered but not serviceable → YELLOW
                    rowBgClass = 'bg-yellow-100';
                  } else if (
                    row.Ordered &&
                    row.ServiceableAcceptable
                  ) {
                    // ordered & serviceable → GREEN
                    rowBgClass = 'bg-green-100';
                  }

                  // 3) Build array in EXACT column order:
                  const cells = [
                    partNum,       // PartNumber
                    desc,          // Description
                    service,       // ServiceNeeded
                    core,          // CoreSerial
                    notes,         // Notes
                    neu,           // NewSerial
                    vendor,        // Vendor
                    price,         // Price
                    bill,          // Billbacks
                    poNum,         // PONumber
                    ordText,       // Ordered (Yes/No)
                    recText,       // Received (Yes/No)
                    svcOkText,     // ServiceableAcceptable (Yes/No)
                    mech,          // MechanicName
                    work,          // WorkOrder
                    dateReq,       // DateRequired
                    reqDate,       // RequestDate
                    task,          // TaskNumber
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
                      colSpan={18}
                      className="py-4 text-center text-gray-600"
                    >
                      Loading more…
                    </td>
                  </tr>
                )}

                {/* Sentinel for IntersectionObserver: */}
                <tr>
                  <td colSpan={18}>
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
