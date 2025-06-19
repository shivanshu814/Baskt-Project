import React from 'react';
import { Badge } from "../ui/badge";
import { Filter, X } from 'lucide-react';
import { ActiveFiltersSummaryProps } from '../../types/history';

const ActiveFiltersSummary: React.FC<ActiveFiltersSummaryProps> = ({ filters, onRemoveFilter }) => {
    const filterFields = [
        {
            key: 'basktId',
            label: 'Baskt ID',
            value: filters.basktId,
            displayValue: filters.basktId ? `${filters.basktId.slice(0, 8)}...` : ''
        },
        {
            key: 'userId',
            label: 'User ID',
            value: filters.userId,
            displayValue: filters.userId ? `${filters.userId.slice(0, 8)}...` : ''
        },
        {
            key: 'status',
            label: 'Status',
            value: filters.status,
            displayValue: filters.status
        },
        {
            key: 'action',
            label: 'Action',
            value: filters.action,
            displayValue: filters.action
        }
    ];

    const activeFilters = filterFields.filter(field => field.value);

    if (activeFilters.length === 0) return null;

    return (
        <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
            <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-medium text-blue-300">Active Filters</h4>
            </div>
            <div className="flex flex-wrap gap-2">
                {activeFilters.map((field) => (
                    <Badge
                        key={field.key}
                        variant="secondary"
                        className="bg-blue-600/20 text-blue-300 border-blue-500/30 flex items-center gap-1"
                    >
                        {field.label}: {field.displayValue}
                        <button
                            onClick={() => onRemoveFilter(field.key)}
                            className="ml-1 hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    );
};

export default ActiveFiltersSummary; 