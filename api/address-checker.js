const express = require("express");
const axios = require("axios");

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to check addresses
app.post("/api/check-addresses", async (req, res) => {
  const addresses = req.body.addresses;

  if (!addresses || addresses.length === 0) {
    return res.status(400).json({ error: "No addresses provided" });
  }

  const results = [];
  const API_KEY = "d6aebfed1769128379aca7d215f0b689";
  const URL = "https://mainnet-api.oyl.gg/get-whitelist-leaderboard";

  for (const address of addresses) {
    try {
      const response = await axios.post(
        URL,
        { address },
        {
          headers: {
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "X-OYL-API-KEY": API_KEY,
          },
        }
      );
      const data = response.data;
      results.push({
        address,
        walletRank: data.walletRank || "N/A",
        whale: data.whale || "N/A",
        priority: data.priority || "N/A",
        fatMeter: data.fatMeter || "N/A",
        guaranteedMint: data.guaranteedMint || "N/A",
      });
    } catch (error) {
      console.error(`Error fetching data for address ${address}:`, error.message);
      results.push({
        address,
        error: "Failed to fetch data",
      });
    }
  }

  res.json(results);
});

module.exports = app;
