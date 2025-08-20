import { toast } from 'sonner';
import { ROUTES } from '../../routes/route';

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
    basktId: string,
    successMessage = 'Link copied! You can now share this baskt.',
  ) => {
    const tradeUrl = `${window.location.origin}${ROUTES.TRADE}/${encodeURIComponent(basktId)}`;
    await shareLink(tradeUrl, successMessage);
  };

  return {
    shareLink,
    shareCurrentPage,
    shareBasktLink,
  };
};
