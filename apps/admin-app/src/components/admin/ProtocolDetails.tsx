'use client';

import React from 'react';
import { useProtocol } from '../../hooks/useProtocol';
import { useBasktClient } from '../../providers/BasktClientProvider';

interface ProtocolDetailsProps {
  className?: string;
}

export function ProtocolDetails({ className = '' }: ProtocolDetailsProps) {
  const { client } = useBasktClient();
  const { protocol } = useProtocol();

  const handleInitializeProtocol = async () => {
    try {
      await client?.initializeProtocol();
    } catch (error) {
      console.error('Error initializing protocol:', error); //eslint-disable-line
    }
  };

  if (!protocol) {
    return (
      <div className={`p-4 bg-yellow-50 rounded-lg shadow ${className}`}>
        <p className="text-yellow-700">No protocol information available.</p>
        <div className="mt-4 flex space-x-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleInitializeProtocol()}
          >
            Initialize Protocol
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Protocol Details</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">General Information</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-600">Status:</div>
          <div className="font-medium">
            <span className="text-green-600">Initialized</span>
          </div>

          <div className="text-gray-600">Owner:</div>
          <div className="font-medium text-sm break-all">{protocol.owner}</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Feature Flags</h3>
        <div className="grid grid-cols-2 gap-2">
          {protocol.featureFlags &&
            Object.entries(protocol.featureFlags).map(([key, value]) => (
              <React.Fragment key={key}>
                <div className="text-gray-600">{formatFeatureFlagName(key)}:</div>
                <div className="font-medium">
                  {value ? (
                    <span className="text-green-600">Enabled</span>
                  ) : (
                    <span className="text-red-600">Disabled</span>
                  )}
                </div>
              </React.Fragment>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Control</h3>
        {protocol.accessControl.entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Account
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {protocol.accessControl.entries.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 break-all">
                      {entry.account}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.role}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No access control entries found.</p>
        )}
      </div>
    </div>
  );
}

// Helper function to format feature flag names for display
function formatFeatureFlagName(key: string): string {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
    .trim();
}
