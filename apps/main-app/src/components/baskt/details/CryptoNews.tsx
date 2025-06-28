import { ArrowUpRight } from 'lucide-react';
import { CryptoNewsProps, Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';

export function CryptoNews({ news }: CryptoNewsProps) {
  return (
    <Card className="!rounded-none !-mt-1 -ml-1">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg -mt-2 -ml-3">Top Crypto News</CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 space-y-2 -mt-5">
        {news.map((item) => (
          <Card
            key={item.id}
            className="hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => window.open(item.url, '_blank')}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md overflow-hidden shrink-0">
                  <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
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
