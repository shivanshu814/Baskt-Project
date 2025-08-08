'use client';
import React from 'react';

export const TableHeader = React.memo(() => (
  <thead>
    <tr className="bg-foreground/5 border-b border-foreground/10">
      <th className="px-4 py-3 text-left font-semibold text-foreground/80 text-xs uppercase tracking-wider">
        Asset
      </th>
      <th className="px-4 py-3 text-left font-semibold text-foreground/80 text-xs uppercase tracking-wider">
        Long Exposure
      </th>
      <th className="px-4 py-3 text-left font-semibold text-foreground/80 text-xs uppercase tracking-wider">
        Short Exposure
      </th>
      <th className="px-4 py-3 text-left font-semibold text-foreground/80 text-xs uppercase tracking-wider">
        Net Exposure
      </th>
    </tr>
  </thead>
));

TableHeader.displayName = 'TableHeader';
