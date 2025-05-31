import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import type { PoolParticipantsProps } from '../../types/pool';
import { PAGE_SIZE_OPTIONS } from '../../constants/pool';

export function PoolParticipants({
  participants,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PoolParticipantsProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handlePageSizeChange = (size: (typeof PAGE_SIZE_OPTIONS)[number]) => {
    onPageSizeChange(size);
  };

  return (
    <Card className="bg-white/5 border-white/10 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Pool Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">Rows per page</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) =>
                  handlePageSizeChange(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number])
                }
              >
                <SelectTrigger className="w-[100px] bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-white/60">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60">S.No</th>
                  <th className="text-left py-3 px-4 text-white/60">Address</th>
                  <th className="text-left py-3 px-4 text-white/60">USDC Deposit</th>
                  <th className="text-left py-3 px-4 text-white/60">Share %</th>
                  <th className="text-left py-3 px-4 text-white/60">LP Tokens</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant, index) => (
                  <tr
                    key={participant.address}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-3 px-4 text-white/80">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-3 px-4 text-white/80 font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span>
                          {participant.address.slice(0, 4)}...{participant.address.slice(-4)}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(participant.address);
                            setCopiedAddress(participant.address);
                            setTimeout(() => setCopiedAddress(null), 1200);
                          }}
                          className="p-1 rounded hover:bg-white/10 transition"
                          title="Copy address"
                          type="button"
                        >
                          {copiedAddress === participant.address ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-white/40" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/80">
                      ${participant.usdcDeposit.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white/80">{participant.sharePercentage}%</td>
                    <td className="py-3 px-4 text-white/80">
                      {participant.lpTokens.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-white/60">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, participants.length)} of {participants.length}{' '}
              entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
