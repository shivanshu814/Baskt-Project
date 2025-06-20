import React from 'react';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@baskt/ui';
import { OrderAction, OrderStatus, PositionStatus } from '@baskt/types';
import { Filter, RefreshCw } from 'lucide-react';
import { HistoryFiltersProps } from '../../types/history';

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  onRefresh,
  isLoading,
}) => {
  const filterFields = [
    {
      key: 'basktId',
      label: 'Baskt ID',
      type: 'input',
      placeholder: 'Enter Baskt ID',
      value: filters.basktId,
    },
    {
      key: 'userId',
      label: 'User ID',
      type: 'input',
      placeholder: 'Enter User ID',
      value: filters.userId,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      value: filters.status || 'all',
      options: [
        { value: 'all', label: 'All Status' },
        { value: OrderStatus.PENDING, label: 'Pending' },
        { value: OrderStatus.FILLED, label: 'Filled' },
        { value: OrderStatus.CANCELLED, label: 'Cancelled' },
        { value: PositionStatus.OPEN, label: 'Open' },
        { value: PositionStatus.CLOSED, label: 'Closed' },
        { value: PositionStatus.LIQUIDATED, label: 'Liquidated' },
      ],
    },
    {
      key: 'action',
      label: 'Action',
      type: 'select',
      value: filters.action || 'all',
      options: [
        { value: 'all', label: 'All Actions' },
        { value: OrderAction.Open, label: 'Open' },
        { value: OrderAction.Close, label: 'Close' },
      ],
    },
  ];

  // eslint-disable-next-line
  const renderFilterField = (field: any) => {
    if (field.type === 'input') {
      return (
        <Input
          placeholder={field.placeholder}
          value={field.value}
          onChange={(e) => onFilterChange(field.key, e.target.value)}
          className="bg-gray-800 border-gray-600 text-gray-200"
        />
      );
    }

    if (field.type === 'select') {
      return (
        <Select value={field.value} onValueChange={(value) => onFilterChange(field.key, value)}>
          <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
            <SelectValue placeholder={`All ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {/* eslint-disable-next-line */}
            {field.options.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return null;
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center gap-4 mb-4">
        <Filter className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-200">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filterFields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-400 mb-2">{field.label}</label>
            {renderFilterField(field)}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={onClearFilters} variant="outline" size="sm">
          Clear Filters
        </Button>
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default HistoryFilters;
