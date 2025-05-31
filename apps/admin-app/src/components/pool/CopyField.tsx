import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

export const CopyField = React.memo(({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [value]);

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
        {label}
        <button
          onClick={handleCopy}
          className="ml-1 p-1 rounded hover:bg-white/10 transition"
          title="Copy"
          type="button"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-white/40" />
          )}
        </button>
      </div>
      <div className="flex items-center bg-white/10 rounded px-3 py-2 font-mono text-white text-sm break-all shadow-inner">
        {value}
      </div>
    </div>
  );
});

CopyField.displayName = 'CopyField';
