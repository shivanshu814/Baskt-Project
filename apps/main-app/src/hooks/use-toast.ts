import { toast } from 'sonner';

export const useToast = () => {
  const success = (message: string, description?: string) => {
    toast.success(message, {
      description,
    });
  };

  const error = (message: string, description?: string) => {
    toast.error(message, {
      description,
    });
  };

  const warning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
    });
  };

  const info = (message: string, description?: string) => {
    toast.info(message, {
      description,
    });
  };

  const loading = (message: string, description?: string) => {
    return toast.loading(message, {
      description,
    });
  };

  const dismiss = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
  };
};
