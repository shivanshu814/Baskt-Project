'use client';

import { Button, Dialog, DialogContent } from '@baskt/ui';
import { Copy, ExternalLink, Share2, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { ROUTES } from '../../routes/route';
import { CongratulationsModalProps } from '../../types/baskt/trading/modals';

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
      const link = `${window.location.origin}${ROUTES.TRADE}/${basktId}`;
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
      const link = `${window.location.origin}${ROUTES.TRADE}/${basktId}`;
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
      <DialogContent className="sm:max-w-[450px] max-w-[90vw] w-full p-0 rounded-xl overflow-hidden shadow-xl border-0 bg-background/95 backdrop-blur-sm">
        <div className="relative">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 h-6 w-6 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>

          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Congratulations!</h2>
                <p className="text-xs text-muted-foreground">
                  Your baskt has been created successfully
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">{basktName}</h3>
                {basktDescription && (
                  <p className="text-xs text-muted-foreground">{basktDescription}</p>
                )}
                <div className="flex gap-1 mt-1">
                  <span className="px-2 py-0.5 bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/30">
                    Custom Weighted
                  </span>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground text-xs font-semibold rounded-full border border-border/50">
                    {assets.length} Assets
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h4 className="text-sm font-semibold text-foreground">Asset Breakdown</h4>
              <span className="text-xs text-muted-foreground ml-auto">
                ({assets.length} assets)
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-2 mb-4 pr-2">
              {assets.map((asset, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/20 via-muted/10 to-muted/5 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    {asset.logo ? (
                      <div className="relative">
                        <Image
                          src={asset.logo}
                          width={24}
                          height={24}
                          alt={asset.ticker}
                          className="h-6 w-6 rounded-full ring-2 ring-border/50 group-hover:ring-primary/30 transition-all duration-300"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border border-background"></div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-border/50 group-hover:ring-primary/30 transition-all duration-300">
                          <span className="text-xs font-bold text-primary">
                            {asset.ticker.charAt(0)}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border border-background"></div>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-semibold text-foreground">{asset.ticker}</span>
                      <div className="text-xs text-muted-foreground">Asset {index + 1}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                        style={{ width: `${asset.weight}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-primary min-w-[2.5rem] text-right">
                      {asset.weight}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h4 className="text-sm font-semibold text-foreground">Share your baskt</h4>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 px-3 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 hover:bg-primary/20 transition-all duration-300 text-xs"
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
                {basktId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-8 px-3 bg-gradient-to-r from-success/10 to-success/5 border-success/30 hover:border-success/50 hover:bg-success/20 transition-all duration-300 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                )}
              </div>
              {basktId && (
                <div className="relative">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-muted/20 via-muted/10 to-muted/5 border border-border/30">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={`${window.location.origin}/trade/${basktId}`}
                        readOnly
                        className="w-full bg-transparent text-xs text-muted-foreground outline-none font-mono"
                      />
                    </div>
                    <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <Button
                onClick={handleViewBaskt}
                className="w-full bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-primary-foreground h-10 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Your Baskt
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
