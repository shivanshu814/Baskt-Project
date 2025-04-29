import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Copy, Check } from 'lucide-react';
import { TruncatedText } from '../../components/TruncatedText';
import { useState } from 'react';

interface ShareBasktModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  basktName: string;
  basktPrice: number;
}

export function ShareBasktModal({
  isOpen,
  onOpenChange,
  basktName,
  basktPrice,
}: ShareBasktModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
            <div className="font-semibold text-primary text-2xl">{basktName.substring(0, 2)}</div>
          </div>

          <h2 className="text-2xl font-bold text-center">Share it with your friends</h2>

          <p className="text-muted-foreground text-center">
            The price of <span className="font-medium text-foreground">{basktName}</span> is{' '}
            <span className="font-medium text-foreground">${basktPrice.toLocaleString()}!</span>
          </p>

          <div className="relative w-full">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <div className="flex-1 px-2 text-sm">
                <TruncatedText
                  text={window.location.href}
                  startChars={15}
                  endChars={10}
                  copyOnClick={true}
                />
              </div>
              <Button variant="secondary" size="sm" onClick={handleCopyLink} className="shrink-0">
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
