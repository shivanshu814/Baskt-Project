'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@baskt/ui';
import {
  MessageCircle,
  Users,
  LifeBuoy,
  PartyPopper,
} from 'lucide-react';

interface AccessCodeSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TextLinkProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText: string;
  onClick: () => void;
  color: string;
}

function TextLink({ icon, title, description, linkText, onClick, color }: TextLinkProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-md transition-colors">
      <div className={`text-${color}-400 flex-shrink-0`}>{icon}</div>
      <div className="flex-1">
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-white/60 text-sm">
          {description}{' '}
          <span 
            onClick={onClick} 
            className={`text-${color}-400 underline cursor-pointer hover:text-${color}-300`}
          >
            {linkText}
          </span>
        </p>
      </div>
    </div>
  );
}

function FeedbackInfo() {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-md transition-colors">
      <div className="text-blue-400 flex-shrink-0">
        <MessageCircle className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-white">Submit Feedback</h3>
        <p className="text-white/60 text-sm">
          Please use the blue feedback button on the bottom right of the application
        </p>
      </div>
    </div>
  );
}

export function AccessCodeSuccessDialog({ isOpen, onClose }: AccessCodeSuccessDialogProps) {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (isOpen) {
      setCountdown(15);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(onClose, 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, onClose]);

  const handleTelegramClick = () => {
    const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_GROUP_URL || 'https://t.me/basktai';
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };
  
  const handleSupportClick = () => {
    const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_CONTACT_URL || 'https://t.me/basktai';
    window.open(supportUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md bg-background border border-white/10 shadow-lg rounded-lg p-0">

        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-center text-xl font-bold text-white flex items-center justify-center gap-2">
            Welcome to Baskt!
            <PartyPopper className="h-5 w-5 text-yellow-400" />
          </DialogTitle>
          <DialogDescription className="text-center text-white/70 text-sm">
            Your access has been granted successfully
          </DialogDescription>
        </DialogHeader>

        <div className="p-4">
          <FeedbackInfo />
          
          <TextLink 
            icon={<Users className="h-5 w-5" />}
            title="Join Our Community"
            description="Connect with other Baskt users via our"
            linkText="Community"
            onClick={handleTelegramClick}
            color="green"
          />
          
          <TextLink 
            icon={<LifeBuoy className="h-5 w-5" />}
            title="Need Help?"
            description="Get support for any questions via"
            linkText="Contact"
            onClick={handleSupportClick}
            color="purple"
          />
        </div>

        <DialogFooter className="px-5 py-3 border-t border-white/10">
          <div className="w-full text-center text-white/60 text-xs">
            Closing in <span className="font-mono font-bold text-white">{countdown}s</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
