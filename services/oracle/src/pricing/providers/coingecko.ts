import axios from "axios";
const API_KEY = "CG-cZEgFTjtp8uWV4QwbwYPVzHz";

export default async function getCoinGeckoData(coinId: string) {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;
  const options = {
    method: "GET",
    headers: { accept: "application/json", "x-cg-demo-api-key": API_KEY },
  };

  try {
    const response = await axios.get(url, options);
    return response.data;
  } catch (error) {
    console.error("Error fetching data from CoinGecko:", error);
  }
  return null;
}
