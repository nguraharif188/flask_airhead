const express = require("express");
const axios = require("axios");
const { Parser } = require("json2csv");

const app = express();

app.use(express.json());

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
            "X-OYL-API-KEY": API_KEY,
            "Content-Type": "application/json",
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
      results.push({
        address,
        error: "Failed to fetch data",
      });
    }
  }

  res.json(results);
});

app.get("/api/download-csv", (req, res) => {
  const results = JSON.parse(req.query.data || "[]");
  const parser = new Parser();
  const csv = parser.parse(results);

  res.header("Content-Type", "text/csv");
  res.attachment("results.csv");
  res.send(csv);
});

module.exports = app;
