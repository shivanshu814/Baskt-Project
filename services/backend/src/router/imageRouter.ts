import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { put } from '@vercel/blob';

export const imageRouter = router({
  upload: publicProcedure
    .input(
      z.object({
        filename: z.string(),
        data: z.string(),
        contentType: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { filename, data, contentType } = input;
        const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType,
        });

        return blob;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error uploading file',
        });
      }
    }),
});
