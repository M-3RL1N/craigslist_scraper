import express from "express";
import cors from "cors";
import axios from "axios";
import * as xml2js from "xml2js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

const cityMap = {
  tulsa: "tulsa",
  joplin: "joplin",
  springfield: "springfield",
  okc: "oklahomacity",
};

// Endpoint: /deals?city=tulsa&keyword=antique
app.get("/deals", async (req, res) => {
  try {
    const { city = "tulsa", keyword = "antique" } = req.query;
    const subdomain = cityMap[city.toLowerCase()] || "tulsa";

    const url = `https://${subdomain}.craigslist.org/search/sss?query=${encodeURIComponent(
      keyword
    )}&search_distance=60&postal=74370&format=rss`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BoothBossBot/1.0)",
      },
    });

    const parsed = await xml2js.parseStringPromise(response.data);
    const items = (parsed.rss.channel[0].item || []).map((entry) => ({
      title: entry.title?.[0] || "Untitled",
      url: entry.link?.[0] || "",
      price: entry["craigslist:price"]?.[0] || "N/A",
      photo: entry.enclosure?.[0]?.$.url || null,
      source: subdomain,
    }));

    res.json({ deals: items });
  } catch (err) {
    console.error("Error fetching Craigslist:", err.message);
    res.status(500).json({ error: "Failed to fetch Craigslist feed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Craigslist Proxy running on port ${PORT}`);
});
