import { useState, useRef } from 'react';
import { useToast } from '../../common/use-toast';
import { trpc } from '../../../utils/trpc';

export const useBasktImageUpload = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const uploadImageMutation = trpc.image.upload.useMutation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 15MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result as string;
        const filename = `${Date.now()}_${file.name}`;

        const result = await uploadImageMutation.mutateAsync({
          filename,
          data: base64Data,
          contentType: file.type,
        });

        if (result.url) {
          setPreviewImage(result.url);
          return result.url;
        }
      };

      reader.onerror = () => {
        toast({
          title: 'Upload failed',
          description: 'Failed to read image file. Please try again.',
          variant: 'destructive',
        });
      };
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    fileInputRef,
    previewImage,
    setPreviewImage,
    handleImageUpload,
  };
};
