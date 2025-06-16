import { Card, CardContent } from '../../ui/card';
import { ArrowUpRight } from 'lucide-react';
import { CryptoNewsProps } from '@baskt/ui';

export function CryptoNews({ news }: CryptoNewsProps) {
  return (
    <Card>
      <CardContent className="p-[0.7rem]">
        <h1 className="text-[18px] font-bold mb-[0.7rem] ml-[0.3rem]">Top Crypto News</h1>
        {news.map((item, index) => (
          <Card
            key={item.id}
            className={`${index > 0 ? 'mt-[0.7rem]' : ''
              } hover:bg-muted/50 transition-colors cursor-pointer group`}
            onClick={() => window.open(item.url, '_blank')}
          >
            <CardContent className="p-[0.7rem]">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                  <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="text-[14px] font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h1>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground text-xs">{item.time}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
