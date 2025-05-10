import { router, publicProcedure } from '../trpc/trpc';

export const cryptoRouter = router({
  getCryptoNews: publicProcedure.query(async () => {
    try {
      const baseURL = 'https://pro-api.coinmarketcap.com/v1/content/latest';
      const apiKey = process.env.CMC_APIKEY;

      if (!apiKey) {
        throw new Error('CMC API key not found');
      }

      const response = await fetch(
        `${baseURL}?limit=5&news_type=all&content_type=all&language=en`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': apiKey,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to fetch crypto news: ${errorData.status?.error_message || 'Unknown error'}`,
        );
      }

      const data = await response.json();
      return data.data.map((item: any) => ({
        id: item.id?.toString() || Math.random().toString(),
        title: item.title,
        time: new Date(item.released_at || item.created_at).toLocaleString(),
        url: item.source_url,
        cover: item.cover,
      }));
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      return [];
    }
  }),
});
