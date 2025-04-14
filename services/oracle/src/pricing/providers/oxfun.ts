import axios from "axios";

export default async function getOxFunData(coinId: string) {
  const url = `https://api.ox.fun/v3/markets?marketCode=${coinId}`;
  const options = {
    method: "GET",
  };

  try {
    const response = await axios.get(url, options);
    return response.data.data[0].indexPrice;
  } catch (error) {
    console.error("Error fetching data from CoinGecko:", error);
  }
  return null;
}
