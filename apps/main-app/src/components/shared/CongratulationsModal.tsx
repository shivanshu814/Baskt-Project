'use client';

import { Button, Dialog, DialogContent } from '@baskt/ui';
import { CheckCircle, Copy, ExternalLink, Share2, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { ROUTES } from '../../routes/route';
import { CongratulationsModalProps } from '../../types/trading/modals';

export function CongratulationsModal({
  open,
  onOpenChange,
  basktName,
  basktDescription = '',
  assets,
  basktId,
}: CongratulationsModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (basktId) {
      const link = `${window.location.origin}/${ROUTES.TRADE}/${basktId}`;
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const handleViewBaskt = () => {
    if (basktId) {
      window.location.href = `${ROUTES.TRADE}/${basktId}`;
    }
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    window.location.href = ROUTES.EXPLORE;
  };

  const handleShare = () => {
    if (basktId) {
      const link = `${window.location.origin}/${ROUTES.TRADE}/${basktId}`;
      if (navigator.share) {
        navigator.share({
          title: `Check out my ${basktName} baskt!`,
          text: `I just created a new baskt called ${basktName} on Baskt.`,
          url: link,
        });
      } else {
        handleCopyLink();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] w-full p-0 rounded-2xl overflow-hidden shadow-2xl border-0 bg-background/95 backdrop-blur-sm">
        <div className="relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Congratulations!</h2>
                <p className="text-muted-foreground">Your baskt has been created successfully</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{basktName}</h3>
                {basktDescription && (
                  <p className="text-sm text-muted-foreground">{basktDescription}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/30">
                    Custom Weighted
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground text-xs font-semibold rounded-full border border-border/50">
                    {assets.length} Assets
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h4 className="text-lg font-semibold text-foreground">Asset Breakdown</h4>
              <span className="text-sm text-muted-foreground ml-auto">
                ({assets.length} assets)
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-3 mb-6 pr-2">
              {assets.map((asset, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/20 via-muted/10 to-muted/5 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {asset.logo ? (
                      <div className="relative">
                        <Image
                          src={asset.logo}
                          width={32}
                          height={32}
                          alt={asset.ticker}
                          className="h-8 w-8 rounded-full ring-2 ring-border/50 group-hover:ring-primary/30 transition-all duration-300"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background"></div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-border/50 group-hover:ring-primary/30 transition-all duration-300">
                          <span className="text-sm font-bold text-primary">
                            {asset.ticker.charAt(0)}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background"></div>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-foreground">{asset.ticker}</span>
                      <div className="text-xs text-muted-foreground">Asset {index + 1}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                        style={{ width: `${asset.weight}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-primary min-w-[3rem] text-right">
                      {asset.weight}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/50 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h4 className="text-lg font-semibold text-foreground">Share your baskt</h4>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="h-10 px-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 hover:bg-primary/20 transition-all duration-300"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {basktId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-10 px-4 bg-gradient-to-r from-success/10 to-success/5 border-success/30 hover:border-success/50 hover:bg-success/20 transition-all duration-300"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                )}
              </div>
              {basktId && (
                <div className="relative">
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-gradient-to-r from-muted/20 via-muted/10 to-muted/5 border border-border/30">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={`${window.location.origin}/trade/${basktId}`}
                        readOnly
                        className="w-full bg-transparent text-sm text-muted-foreground outline-none font-mono"
                      />
                    </div>
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button
                onClick={handleViewBaskt}
                className="w-full bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-primary-foreground h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                View Your Baskt
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
