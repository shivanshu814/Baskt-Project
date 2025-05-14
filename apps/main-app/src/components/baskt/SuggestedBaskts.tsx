import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Share2, ArrowUp, ArrowDown } from 'lucide-react';
import { ShareBasktModal } from './ShareBasktModal';
import { useState } from 'react';
import { SuggestedBaskt, SuggestedBasktsProps } from '@baskt/ui/types/constants';

export function SuggestedBaskts({ suggestedBaskts }: SuggestedBasktsProps) {
  const [selectedBaskt, setSelectedBaskt] = useState<SuggestedBaskt | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-[0.7rem]">
          <h1 className="text-[18px] font-bold mb-[0.7rem] ml-[0.3rem]">Suggested Baskts</h1>
          {suggestedBaskts.map((baskt, index) => (
            <Card key={baskt.id} className={index > 0 ? 'mt-[0.7rem]' : ''}>
              <CardContent className="p-[0.7rem]">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <div className="font-semibold text-primary text-sm">
                        {baskt.name.substring(0, 2)}
                      </div>
                    </div>
                    <h1 className="text-[18px] font-bold">{baskt.name}</h1>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedBaskt(baskt);
                      setIsShareModalOpen(true);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                  </Button>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2 ml-[2.7rem]">
                    <div className="text-[12px] font-bold">${baskt.price.toLocaleString()}</div>
                    <div
                      className={`flex items-center gap-1 ${baskt.change24h >= 0 ? 'text-[#16C784]' : 'text-[#EA3943]'}`}
                    >
                      {baskt.change24h >= 0 ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      <span className="text-[12px]">
                        {Math.abs(baskt.change24h).toFixed(2)}% 
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {selectedBaskt && (
        <ShareBasktModal
          isOpen={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          basktName={selectedBaskt.name}
          basktPrice={selectedBaskt.price}
        />
      )}
    </div>
  );
}
