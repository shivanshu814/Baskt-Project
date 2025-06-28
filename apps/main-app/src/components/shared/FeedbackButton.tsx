'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@baskt/ui';

export function FeedbackButton() {
  const handleFeedbackClick = () => {
    const formId = process.env.NEXT_PUBLIC_TYPEFORM_ID || 'YOUR_FORM_ID';
    const typeformUrl = `https://form.typeform.com/to/${formId}`;
    window.open(typeformUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleFeedbackClick}
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground"
        aria-label="Give Feedback"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        Feedback
      </Button>
    </div>
  );
}
