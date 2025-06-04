// app/orders/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

interface RawPartRow {
  MechanicID: number;
  MechanicName: string | null;
  WorkOrder: string | null;
  SubmissionTime: string | null;
  RequestDate: string | null;
  OrderID: number | null;
  PONumber: number | null;
  GroupPO: number | null;
  PartNumber: string | null;
  PartDescription: string | null;
  TaskNumber: string | null;
  Quantity: number | null;
  DateRequired: string | null;
  OrderDate: string | null;
  Notes: string | null;
  UnitOfMeasure: string | null;
  Location: string | null;
  Ordered: boolean | null;
  Received: boolean | null;
  Vendor: string | null;
  FromStock: boolean | null;
  NoAlternates: boolean | null;
}

type SortKey =
  | 'PONumber'
  | 'GroupPO'
  | 'WorkOrder'
  | 'PartNumber'
  | 'ReqDate'
  | 'DateRequired'
  | 'Quantity'
  | 'UnitOfMeasure'
  | 'MechanicName'
  | 'Location'
  | 'FromStock'
  | 'NoAlternates'
  | 'Ordered'
  | 'Received'
  | 'Vendor';

export default function OrdersPage() {
  const [allParts, setAllParts] = useState<RawPartRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: 'asc' | 'desc';
  } | null>(null);

  // How many “pages” we’ve loaded
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 50;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const getValue = (row: RawPartRow, key: SortKey): any => {
    switch (key) {
      case 'PONumber':
        return row.PONumber ?? 0;
      case 'GroupPO':
        return row.GroupPO ?? 0;
      case 'WorkOrder':
        return (row.WorkOrder ?? '').toLowerCase();
      case 'PartNumber':
        return (row.PartNumber ?? '').toLowerCase();
      case 'ReqDate':
        return row.RequestDate ? new Date(row.RequestDate).getTime() : 0;
      case 'DateRequired':
        return row.DateRequired ? new Date(row.DateRequired).getTime() : 0;
      case 'Quantity':
        return row.Quantity ?? 0;
      case 'UnitOfMeasure':
        return (row.UnitOfMeasure ?? '').toLowerCase();
      case 'MechanicName':
        return (row.MechanicName ?? '').toLowerCase();
      case 'Location':
        return (row.Location ?? '').toLowerCase();
      case 'Ordered':
        return row.Ordered === null ? -1 : row.Ordered ? 1 : 0;
      case 'Received':
        return row.Received === null ? -1 : row.Received ? 1 : 0;
      case 'Vendor':
        return (row.Vendor ?? '').toLowerCase();
      case 'FromStock':
        return row.FromStock ? 1 : 0;
      case 'NoAlternates':
        return row.NoAlternates ? 1 : 0;
      default:
        return '';
    }
  };

  // ─── 1) LOAD + IMMEDIATELY SORT BY RequestDate DESC ───────────────────────────
  useEffect(() => {
    async function loadAllParts() {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: RawPartRow[] = await res.json();

        // Sort by RequestDate DESC before storing in state:
        const byDateDesc = data
          .slice()
          .sort((a, b) => {
            const aTs = a.RequestDate ? new Date(a.RequestDate).getTime() : 0;
            const bTs = b.RequestDate ? new Date(b.RequestDate).getTime() : 0;
            return bTs - aTs;
          });

        setAllParts(byDateDesc);
      } catch (err: any) {
        console.error('Error loading parts data:', err);
        setError('Failed to load parts data.');
      } finally {
        setLoading(false);
      }
    }

    loadAllParts();
  }, []);

  // ─── 2) TOGGLE sortConfig (no immediate re‐slice here) ────────────────────────
  const requestSort = (key: SortKey) => {
    let newConfig: { key: SortKey; direction: 'asc' | 'desc' } | null = {
      key,
      direction: 'asc',
    };
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        newConfig = { key, direction: 'desc' };
      } else {
        newConfig = null;
      }
    }
    setSortConfig(newConfig);
  };

  // ─── 3) DERIVE sortedParts = “allParts, sorted by either sortConfig or (default date‐desc)” ───
  const sortedParts = useMemo<RawPartRow[]>(() => {
    if (!sortConfig) {
      // default: RequestDate DESC
      return allParts
        .slice()
        .sort((a, b) => {
          const aTs = a.RequestDate ? new Date(a.RequestDate).getTime() : 0;
          const bTs = b.RequestDate ? new Date(b.RequestDate).getTime() : 0;
          return bTs - aTs;
        });
    }

    const { key, direction } = sortConfig;

    return allParts
      .slice()
      .sort((a, b) => {
        // 1) If sorting by GroupPO, map null→Infinity so “null” always sorts at the end:
        if (key === 'GroupPO') {
          const aGp = a.GroupPO != null ? a.GroupPO : Infinity;
          const bGp = b.GroupPO != null ? b.GroupPO : Infinity;
          if (aGp < bGp) return direction === 'asc' ? -1 : 1;
          if (aGp > bGp) return direction === 'asc' ? 1 : -1;
          // aGp === bGp → fall back to date below
        } else {
          // 2) For any other key, use your existing getValue() approach:
          const aVal = getValue(a, key);
          const bVal = getValue(b, key);
          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
          // aVal === bVal → fall back to date below
        }

        // 3) FALLBACK: if values are “tied” (or tie caused by both-null GroupPO),
        //    sort by RequestDate DESC so the newest still floats up within each group.
        const aTs = a.RequestDate ? new Date(a.RequestDate).getTime() : 0;
        const bTs = b.RequestDate ? new Date(b.RequestDate).getTime() : 0;
        return bTs - aTs;
      });
  }, [allParts, sortConfig]);

  // ─── 4) DERIVE displayRows = “filter out blanks → (if text filter → text‐search) → (else → paginate)” ───
  const displayRows = useMemo<RawPartRow[]>(() => {
    const term = filter.trim().toLowerCase();

    // 4.1) First, ALWAYS drop the “blank” rows:
    const nonBlank = sortedParts.filter((row) => {
      const noPartNumber = !row.PartNumber || row.PartNumber.trim() === '';
      const noDescription =
        !row.PartDescription || row.PartDescription.trim() === '';
      const noQuantity = row.Quantity == null;
      return !(noPartNumber && noDescription && noQuantity);
    });

    // 4.2) If there’s a text‐search term, apply your existing filter logic to nonBlank:
    if (term !== '') {
      return nonBlank.filter((row) => {
        const poStr = (row.PONumber ?? '').toString().toLowerCase();
        const gpStr = (row.GroupPO ?? '').toString().toLowerCase();
        const wo = (row.WorkOrder ?? '').toLowerCase();
        const partNum = (row.PartNumber ?? '').toLowerCase();
        const mech = (row.MechanicName ?? '').toLowerCase();
        return (
          poStr.includes(term) ||
          gpStr.includes(term) ||
          wo.includes(term) ||
          partNum.includes(term) ||
          mech.includes(term)
        );
      });
    }

    // 4.3) Otherwise (empty filter), just paginate the nonBlank array:
    return nonBlank.slice(0, pageCount * pageSize);
  }, [filter, sortedParts, pageCount]);

  // ─── 5) “Load more” = increase pageCount ───────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPageCount((prev) => prev + 1);
      setLoadingMore(false);
    }, 200);
  }, [loadingMore]);

  // ─── 6) IntersectionObserver only when “filter === ''” ────────────────────
  useEffect(() => {
    if (filter.trim() !== '') return;
    if (!sentinelRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            // Are there more pages to load?
            sortedParts.length > pageCount * pageSize
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
  }, [filter, sortedParts.length, pageCount, loadMore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="text-gray-600">Loading parts…</span>
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

  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">
          All Requested Parts
        </h1>

        <div className="mb-4">
          <label
            htmlFor="filter"
            className="block text-sm font-medium text-gray-700"
          >
            Search by PO #, Group PO, Work Order, Part #, or Requester
          </label>
          <input
            id="filter"
            type="text"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPageCount(1); // reset pagination when filter changes
            }}
            placeholder="Type to filter…"
            className="mt-1 block w-full rounded-md text-gray-700 border-gray-300 shadow-sm
                       focus:border-blue-300 focus:ring focus:ring-blue-200 sm:text-sm p-2"
          />
        </div>

        <div className="shadow border border-gray-200 sm:rounded-lg">
          <div
            ref={scrollContainerRef}
            className="bg-white overflow-x-auto overflow-y-auto h-[70vh]"
          >
            <table className="min-w-full table-auto border-collapse">
              {/* ─── Sticky Header ──────────────────────────────────── */}
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  {[
                    { label: 'PO #', key: 'PONumber' as SortKey },
                    { label: 'Group PO', key: 'GroupPO' as SortKey },
                    { label: 'Work Order', key: 'WorkOrder' as SortKey },
                    { label: 'Part #', key: 'PartNumber' as SortKey },
                    { label: 'Description', key: null },
                    { label: 'Notes', key: null },
                    { label: 'Qty', key: 'Quantity' as SortKey },
                    { label: 'Unit', key: 'UnitOfMeasure' as SortKey },
                    { label: 'Ordered', key: null },
                    { label: 'Received', key: null },
                    { label: 'Vendor', key: 'Vendor' as SortKey },
                    { label: 'Req Date', key: 'ReqDate' as SortKey },
                    { label: 'Date Req', key: 'DateRequired' as SortKey },
                    { label: 'Requester', key: 'MechanicName' as SortKey },
                    { label: 'Location', key: 'Location' as SortKey },
                    { label: 'From Stock', key: 'FromStock' as SortKey },
                    { label: 'No Alternates', key: 'NoAlternates' as SortKey },
                  ].map((col, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={col.key ? () => requestSort(col.key) : undefined}
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

              <tbody className="bg-white divide-y divide-gray-200">
                {displayRows.map((row, idx) => {
                  const poNum = row.PONumber != null ? row.PONumber : '—';
                  const gpNum = row.GroupPO != null ? row.GroupPO : '—';
                  const work = row.WorkOrder ?? '—';
                  const part = row.PartNumber ?? '—';
                  const desc = row.PartDescription ?? '—';
                  const note = row.Notes ?? '—';
                  const ord =
                    row.Ordered === null
                      ? '—'
                      : row.Ordered
                      ? 'Yes'
                      : 'No';
                  const rec =
                    row.Received === null
                      ? '—'
                      : row.Received
                      ? 'Yes'
                      : 'No';
                  const vend = row.Vendor ?? '—';
                  const reqDate = row.RequestDate
                    ? new Date(row.RequestDate).toLocaleDateString()
                    : '—';
                  const dateReq = row.DateRequired
                    ? new Date(row.DateRequired).toLocaleDateString()
                    : '—';
                  const qty = row.Quantity != null ? row.Quantity : '—';
                  const unit = row.UnitOfMeasure ?? '—';
                  const mech = row.MechanicName ?? '—';
                  const loc = row.Location ?? '—';
                  const fromStk = row.FromStock ? 'Yes' : 'No';
                  const noAlt = row.NoAlternates ? 'Yes' : 'No';

                  // ─── CONDITIONAL ROW COLOR ───────────────────────────────
                  let rowBgClass = '';
                  if (!row.Ordered) {
                    // Ordered = false or null → RED
                    rowBgClass = 'bg-red-100';
                  } else if (row.Ordered && !row.Received) {
                    // Ordered = true, Received = false/null → YELLOW
                    rowBgClass = 'bg-yellow-100';
                  } else if (row.Ordered && row.Received) {
                    // Both Ordered & Received = true → GREEN
                    rowBgClass = 'bg-green-100';
                  }

                  const cells = [
                    poNum,
                    gpNum,
                    work,
                    part,
                    desc,
                    note,
                    qty,
                    unit,
                    ord,
                    rec,
                    vend,
                    reqDate,
                    dateReq,
                    mech,
                    loc,
                    fromStk,
                    noAlt,
                  ];

                  return (
                    <tr
                      key={idx}
                      className={`${rowBgClass} hover:bg-gray-50`}
                    >
                      {cells.map((text, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-800"
                        >
                          {text}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {loadingMore && (
                  <tr>
                    <td colSpan={15} className="py-4 text-center text-gray-600">
                      Loading more…
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={15}>
                    <div ref={sentinelRef} />
                  </td>
                </tr>
              </tbody>
            </table>

            {!displayRows.length && !loadingMore && (
              <div className="mt-6 text-center text-gray-500">
                No parts match your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
