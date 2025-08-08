import { toast } from 'sonner';

export const useShareLink = () => {
  const shareLink = async (
    url: string,
    successMessage = 'Link copied! You can now share this.',
  ) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(successMessage);
    } catch (err) {
      toast.error('Failed to copy link. Please try again.');
      console.error('Failed to copy link:', err);
    }
  };

  const shareCurrentPage = async (successMessage = 'Link copied! You can now share this.') => {
    await shareLink(window.location.href, successMessage);
  };

  const shareBasktLink = async (
    basktName: string,
    successMessage = 'Link copied! You can now share this baskt.',
  ) => {
    const tradeUrl = `${window.location.origin}/trade/${encodeURIComponent(basktName)}`;
    await shareLink(tradeUrl, successMessage);
  };

  return {
    shareLink,
    shareCurrentPage,
    shareBasktLink,
  };
};
