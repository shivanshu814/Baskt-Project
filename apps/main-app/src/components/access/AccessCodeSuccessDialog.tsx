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
import { Button } from '@baskt/ui';
import {
  MessageCircle,
  Users,
  LifeBuoy,
  ExternalLink,
  X as LucideX,
  PartyPopper,
} from 'lucide-react';

interface AccessCodeSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessCodeSuccessDialog({ isOpen, onClose }: AccessCodeSuccessDialogProps) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (isOpen) {
      setCountdown(30);
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

  const handleFeedbackClick = () => {
    const formId = process.env.NEXT_PUBLIC_TYPEFORM_ID || 'YOUR_FORM_ID';
    const typeformUrl = `https://form.typeform.com/to/${formId}`;
    window.open(typeformUrl, '_blank', 'noopener,noreferrer');
  };
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
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg bg-background border border-white/10 shadow-lg rounded-md sm:rounded-lg p-0 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full hover:bg-white/10 text-white transition"
          aria-label="Close dialog"
        >
          <LucideX className="h-5 w-5" />
        </button>

        <DialogHeader className="px-3 sm:px-8 pt-4 sm:pt-8 pb-2">
          <DialogTitle className="text-center text-xl sm:text-2xl font-bold text-white">
            Welcome to Baskt!{' '}
            <PartyPopper className="inline-block h-6 w-6 sm:h-7 sm:w-7 text-yellow-400" />
          </DialogTitle>
          <DialogDescription className="text-center text-white/80 text-base mt-2">
            Your access has been granted successfully. Here's what you can do next:
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:gap-5 px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="flex items-start gap-3 sm:gap-4 bg-white/5 border-l-4 border-blue-500/20 rounded-md sm:rounded-lg p-4 sm:p-5 shadow-sm">
            <div className="mt-1">
              <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-base sm:text-lg mb-1">
                Submit Feedback
              </h3>
              <p className="text-white/60 text-sm mb-3">
                Help us improve by sharing your thoughts and suggestions
              </p>
              <Button
                onClick={handleFeedbackClick}
                size="lg"
                className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 py-2 sm:py-2.5"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Give Feedback
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4 bg-white/5 border-l-4 border-green-500/20 rounded-md sm:rounded-lg p-4 sm:p-5 shadow-sm">
            <div className="mt-1">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-base sm:text-lg mb-1">
                Join Our Community
              </h3>
              <p className="text-white/60 text-sm mb-3">
                Stay updated with announcements and connect with other users
              </p>
              <Button
                onClick={handleTelegramClick}
                size="lg"
                variant="outline"
                className="w-full font-bold border-green-500/30 text-green-400 hover:bg-green-500/10 py-2 sm:py-2.5"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join BASKT.AI Channel
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4 bg-white/5 border-l-4 border-purple-500/20 rounded-md sm:rounded-lg p-4 sm:p-5 shadow-sm">
            <div className="mt-1">
              <LifeBuoy className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-base sm:text-lg mb-1">Need Help?</h3>
              <p className="text-white/60 text-sm mb-3">
                Get support from our team for any questions or issues
              </p>
              <Button
                onClick={handleSupportClick}
                size="lg"
                variant="outline"
                className="w-full font-bold border-purple-500/30 text-purple-400 hover:bg-purple-500/10 py-2 sm:py-2.5"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact @Baskt.ai
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-3 sm:px-8 pb-4 sm:pb-6 pt-2">
          <div className="w-full text-center text-white/60 text-sm">
            This dialog will close automatically in{' '}
            <span className="font-mono font-bold text-white">{countdown}</span> seconds
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
