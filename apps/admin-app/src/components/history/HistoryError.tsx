import React from 'react';
import { AlertCircle } from 'lucide-react';
import { HistoryErrorProps } from '../../types/history';

const HistoryError: React.FC<HistoryErrorProps> = ({ error }) => {
    return (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
            <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                    <h4 className="text-sm font-medium text-red-300 mb-1">Error Loading History</h4>
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            </div>
        </div>
    );
};

export default HistoryError; 