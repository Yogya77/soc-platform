import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectedId?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  selectedId,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'No security events or telemetry match current criteria.',
  searchPlaceholder = 'Search records...',
  searchFilter,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, searchQuery.trim()));
  }, [data, searchQuery, searchFilter]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });
  }, [filteredData, sortKey, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className={cn('flex flex-col bg-[#0f172a] rounded border border-slate-800/80', className)}>
      {searchFilter && (
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              className="w-full bg-[#080c14] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 font-mono-code"
            />
          </div>
          <div className="text-xs text-slate-400 font-mono-code">
            Showing <span className="text-slate-200">{paginatedData.length}</span> of{' '}
            <span className="text-slate-200">{sortedData.length}</span> entries
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#131d33] border-b border-slate-800/80 text-slate-400 font-mono-code font-semibold tracking-wider uppercase">
              {columns.map((col, idx) => {
                const isSorted = sortKey === col.accessorKey;
                const sortValue = col.sortable ? (isSorted ? (sortAsc ? 'ascending' : 'descending') : 'none') : undefined;

                return (
                  <th
                    key={idx}
                    aria-sort={sortValue}
                    onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey)}
                    className={cn(
                      'py-2.5 px-3 select-none',
                      col.sortable && 'cursor-pointer hover:text-slate-200',
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && isSorted && (
                        sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const isSelected = selectedId !== undefined && keyExtractor(item) === selectedId;

                return (
                  <tr
                    key={keyExtractor(item)}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      'transition-colors duration-100',
                      isSelected
                        ? 'bg-[#1a2642] border-l-2 border-l-blue-500 text-blue-200'
                        : onRowClick
                        ? 'cursor-pointer hover:bg-[#1a2642]'
                        : 'hover:bg-[#131d33]/50'
                    )}
                  >
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className={cn('py-2.5 px-3 font-mono-code text-[12px]', col.className)}>
                        {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey] ?? '-') : '-'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono-code">
          <span className="text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="p-1 rounded border border-slate-800 hover:bg-[#131d33] disabled:opacity-30 disabled:pointer-events-none text-slate-400"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="p-1 rounded border border-slate-800 hover:bg-[#131d33] disabled:opacity-30 disabled:pointer-events-none text-slate-400"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
