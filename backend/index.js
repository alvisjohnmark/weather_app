import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cron from "node-cron";

const app = express();
dotenv.config();
app.use(cors());

const googleApiKey = process.env.GOOGLE_API_KEY;
app.get("/api/autocomplete", async (req, res) => {
  const input = req.query.input;

  if (!input) {
    return res.status(400).json({ error: "Missing input parameter" });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&types=geocode&key=${googleApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error fetching from Google API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/place/details", async (req, res) => {
  const input = req.query.input;
  if (!input) {
    return res.status(400).json({ error: "Missing input parameter" });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      input
    )}&key=${googleApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error fetching from Google API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

cron.schedule("*/14 * * * *", async () => {
  try {
    const res = await fetch("https://weather-app-ni-jm.onrender.com"); 
    console.log("Pinged backend:", res.status);
  } catch (error) {
    console.error("Error pinging backend:", error);
  }
});

app.listen(5000, () => {
  console.log("Server running");
});
