'use client';

import { NumberFormat } from '@baskt/ui';
import { X } from 'lucide-react';
import Image from 'next/image';
import { BasktModalProps } from '../../../../types/baskt/ui/ui';

export const BasktModal = ({ isOpen, onClose, tradedBaskts }: BasktModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-card-foreground">All Traded Baskts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You have traded {tradedBaskts.length} baskts
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground transition-colors p-2 rounded-lg hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          {tradedBaskts.map((baskt: any, index: number) => (
            <div
              key={baskt.basktId || index}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-all duration-200"
            >
              <div className="flex items-center">
                <div className="flex -space-x-3">
                  {baskt.assets?.slice(0, 3).map((asset: any, i: number) => (
                    <div key={i} className="relative w-10 h-10 flex items-center justify-center">
                      {asset?.logo ? (
                        <Image
                          src={asset.logo}
                          alt={asset.ticker}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border-2 border-border"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const nextElement = target.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 border-2 border-orange-400 rounded-full flex items-center justify-center bg-secondary">
                          <span className="text-secondary-foreground text-xs font-bold">
                            {asset?.ticker?.slice(0, 2)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-card-foreground underline truncate">
                  {baskt.name || `Baskt ${index + 1}`}
                </span>
                <span className="text-sm text-muted-foreground">
                  {baskt.percentage?.toFixed(1)}%
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-card-foreground font-medium">
                  <NumberFormat value={baskt.value * 1e6} isPrice={true} showCurrency={true} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {baskt.positions?.length || 0} positions
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
