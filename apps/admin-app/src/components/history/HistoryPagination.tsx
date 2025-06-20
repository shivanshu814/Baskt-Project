import React, { useMemo, useCallback } from 'react';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@baskt/ui';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { HistoryPaginationProps } from '../../types/history';

const HistoryPagination: React.FC<HistoryPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  isLoading,
}) => {
  const pageSizeOptions = [25, 50, 100, 200];

  const { startItem, endItem } = useMemo(
    () => ({
      startItem: (currentPage - 1) * pageSize + 1,
      endItem: Math.min(currentPage * pageSize, totalItems),
    }),
    [currentPage, pageSize, totalItems],
  );

  const visiblePages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  const handleFirstPage = useCallback(() => onPageChange(1), [onPageChange]);
  const handlePreviousPage = useCallback(
    () => onPageChange(currentPage - 1),
    [onPageChange, currentPage],
  );
  const handleNextPage = useCallback(
    () => onPageChange(currentPage + 1),
    [onPageChange, currentPage],
  );
  const handleLastPage = useCallback(() => onPageChange(totalPages), [onPageChange, totalPages]);

  const handlePageSizeChange = useCallback(
    (value: string) => {
      onPageSizeChange(parseInt(value));
    },
    [onPageSizeChange],
  );

  const handlePageClick = useCallback(
    (page: number) => {
      onPageChange(page);
    },
    [onPageChange],
  );

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="flex items-center justify-between px-2 py-4 bg-gray-900/50 rounded-lg border border-gray-700">
      <div className="flex items-center space-x-2 text-sm text-gray-300">
        <span>Showing</span>
        <span className="font-medium text-white">{startItem}</span>
        <span>to</span>
        <span className="font-medium text-white">{endItem}</span>
        <span>of</span>
        <span className="font-medium text-white">{totalItems}</span>
        <span>results</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">Items per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-20 h-8 bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {pageSizeOptions.map((size) => (
                <SelectItem
                  key={size}
                  value={size.toString()}
                  className="text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white cursor-pointer transition-colors"
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFirstPage}
            disabled={isFirstPage || isLoading}
            className="h-8 w-8 p-0 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={isFirstPage || isLoading}
            className="h-8 w-8 p-0 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-gray-400">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageClick(page as number)}
                  disabled={isLoading}
                  className={`h-8 w-8 p-0 ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={isLastPage || isLoading}
            className="h-8 w-8 p-0 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLastPage}
            disabled={isLastPage || isLoading}
            className="h-8 w-8 p-0 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistoryPagination;
