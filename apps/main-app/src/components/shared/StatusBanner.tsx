import { Github, Send, Twitter } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { StatusBannerProps } from '../../types/baskt/status/status';
import {
  getStatusColor,
  getStatusDotColor,
  getStatusPulseColor,
} from '../../utils/validation/validation';

export function StatusBanner({
  status = 'operational',
  statusText = 'All systems operational',
  showSocialLinks = true,
}: StatusBannerProps) {
  const { textColor, dotColor, pulseColor } = useMemo(() => {
    return {
      textColor: getStatusColor(status),
      dotColor: getStatusDotColor(status),
      pulseColor: getStatusPulseColor(status),
    };
  }, [status]);

  return (
    <div className="bg-zinc-900/90 border-t border-border px-4 py-2 rounded-sm ml-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`}></div>
            <div
              className={`absolute inset-0 w-5 h-5 -ml-[0.7rem] -mt-[0.7rem] rounded-full ${pulseColor}`}
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            ></div>
          </div>
          <span className={`text-sm ${textColor}`}>{statusText}</span>
        </div>
        {showSocialLinks && (
          <div className="flex items-center gap-6">
            <Link
              href="https://x.com/basktdotai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </Link>
            <Link
              href="https://t.me/basktbeta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Send className="w-4 h-4" />
            </Link>
            <Link
              href="https://github.com/BW-Labs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
