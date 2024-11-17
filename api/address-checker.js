const axios = require("axios");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { addresses } = req.body;

  if (!addresses || addresses.length === 0) {
    return res.status(400).json({ error: "No addresses provided" });
  }

  const API_URL = "https://mainnet-api.oyl.gg/get-whitelist-leaderboard";
  const API_KEY = "d6aebfed1769128379aca7d215f0b689";

  const results = [];

  for (const address of addresses) {
    try {
      const response = await axios.post(
        API_URL,
        { address },
        {
          headers: {
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "X-OYL-API-KEY": API_KEY,
          },
        }
      );

      results.push({
        address,
        walletRank: response.data.walletRank || "N/A",
        whale: response.data.whale || "N/A",
        priority: response.data.priority || "N/A",
        fatMeter: response.data.fatMeter || "N/A",
        guaranteedMint: response.data.guaranteedMint || "N/A",
      });
    } catch (error) {
      console.error(`Error fetching data for address ${address}: ${error.message}`);
      results.push({
        address,
        error: "Failed to fetch data",
      });
    }
  }

  res.status(200).json(results);
};
