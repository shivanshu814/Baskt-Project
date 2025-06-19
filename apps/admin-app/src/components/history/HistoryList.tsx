import React, { useState, useCallback, useMemo } from 'react';
import { useHistory } from '../../hooks/history/useHistory';
import { OrderAction } from '@baskt/types';
import HistoryFilters from './HistoryFilters';
import ActiveFiltersSummary from './ActiveFiltersSummary';
import HistoryTable from './HistoryTable';
import HistoryError from './HistoryError';
import HistoryPagination from './HistoryPagination';

const HistoryList = () => {
    const [filters, setFilters] = useState({
        basktId: '',
        userId: '',
        status: '',
        action: undefined as OrderAction | undefined,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const queryParams = useMemo(() => ({
        ...filters,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
    }), [filters, pageSize, currentPage]);

    const { history, totalCount, isLoading, error, refetch } = useHistory(queryParams);

    const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === 'all' ? undefined : value
        }));
        setCurrentPage(1);
    }, []);

    const handleRemoveFilter = useCallback((key: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: key === 'action' ? undefined : ''
        }));
        setCurrentPage(1);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({
            basktId: '',
            userId: '',
            status: '',
            action: undefined,
        });
        setCurrentPage(1);
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1);
    }, []);

    if (error) {
        return <HistoryError error={error} />;
    }

    return (
        <div className="space-y-6">
            <HistoryFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                onRefresh={refetch}
                isLoading={isLoading}
            />

            <ActiveFiltersSummary
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
            />

            <HistoryTable history={history} isLoading={isLoading} />

            {totalCount > 0 && (
                <HistoryPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalCount}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default HistoryList;