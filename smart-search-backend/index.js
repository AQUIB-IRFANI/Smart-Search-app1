const dotenv = require("dotenv");
const express = require("express");
const axios = require("axios");
const { HfInference } = require("@huggingface/inference");
const { Pinecone } = require("@pinecone-database/pinecone");
const bodyParser = require("body-parser");
const cors = require("cors");

// import bodyParser from "body-parser";

// import fetch from "node-fetch";



dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
// Hugging Face inference client
const inference = new HfInference(process.env.HF_API_KEY);

// Pinecone client
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.Index(process.env.PINECONE_INDEX);

// --- Helper: clean Contentstack image fields ---
function cleanImageField(imageField) {
  if (!imageField) return null;
  const match = imageField.match(/<img.*?src="(.*?)"/);
  return match ? match[1] : imageField;
}

// --- Helper: format publish date ---
function cleanDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toISOString().split("T")[0];
}



async function embedText(text) {
  const result = await inference.featureExtraction({
    model: "intfloat/multilingual-e5-large",
    inputs: text,
  });

  if (!result) throw new Error("Empty embedding result");

  return Array.isArray(result[0]) ? result[0] : result;
}

// --- Webhook endpoint ---
app.post("/webhook", async (req, res) => {
  try {
    console.log("✅ Webhook received!");
    const { data } = req.body;

    if (!data || !data.entry) {
      return res.status(400).json({ error: "No entry in webhook payload" });
    }

    const entry = data.entry;
    const contentType = data.content_type?.uid;

    // Build metadata depending on content type
    let metadata = { content_type: contentType, title: entry.title, tags: entry.tags || [] };


    if (contentType === "products") {
      metadata = {
        ...metadata,
        url: `https://app.contentstack.com/#!/stack/${process.env.CONTENTSTACK_API_KEY}/entry/${entry.uid}`, // Contentstack entry link
        description: entry.description,
        price: entry.price,
        product_image: cleanImageField(entry.product_image),
        category: entry.category,
      };
    } else if (contentType === "blogs") {
      metadata = {
        ...metadata,
        url: `https://app.contentstack.com/#!/stack/${process.env.CONTENTSTACK_API_KEY}/entry/${entry.uid}`, // Contentstack entry link 
        body: entry.body || "",
        author: entry.author || "",
        publish_date: cleanDate(entry.publish_date),
        image: cleanImageField(entry.image),
      };
    } else if (contentType === "events") {
      metadata = {
        ...metadata,
        url: `https://app.contentstack.com/#!/stack/${process.env.CONTENTSTACK_API_KEY}/entry/${entry.uid}`,
        description: entry.description || "",
        location: entry.location || "",
        start_date: cleanDate(entry.start_date),
        end_date: cleanDate(entry.end_date),
        image: cleanImageField(entry.image),
      };
    }

    // Text to embed
    let textToEmbed = `${entry.title} ${(entry.tags || []).join(" ")}`;

    if (contentType === "products") {
      textToEmbed = `${entry.title} ${entry.description} ${(entry.tags || []).join(" ")}`;
    } else if (contentType === "blogs") {
      textToEmbed = `${entry.title} ${entry.body} ${(entry.tags || []).join(" ")}`;
    } else if (contentType === "events") {
      textToEmbed = `${entry.title} ${entry.description} ${entry.location} ${entry.start_date} ${entry.end_date} ${(entry.tags || []).join(" ")}`;
    }
    const embedding = await embedText(textToEmbed);

    await index.upsert([
      {
        id: entry.uid,
        values: embedding,
        metadata,
      },
    ]);

    console.log(`✅ Upserted entry ${entry.uid} (${contentType}) into Pinecone`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/item/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Explicitly set namespace "__default__"
    const response = await index.query({
      ids: [id],
      namespace: "__default__",
    });
    console.log("🔍 Pinecone fetch raw response:", response);
    console.log("🔍 Raw Pinecone fetch response:", JSON.stringify(response, null, 2));

    if (!response || !response.vectors || !response.vectors[id]) {
      return res.status(404).json({ error: "Item not found in Pinecone" });
    }

    const item = {
      id,
      ...response.vectors[id].metadata,
    };

    res.json(item);
  } catch (err) {
    console.error("❌ Item fetch error:", err.message || err);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});



// --- Search endpoint ---
app.get("/search", async (req, res) => {
  try {
    const { q, type, minScore } = req.query;

    if (!q) return res.status(400).json({ error: "Missing search query ?q=" });

    console.log(`🔍 Searching for: "${q}"`);

    const embedding = await embedText(q);

    const results = await index.query({
      vector: Array.from(embedding),
      topK: 5,
      includeMetadata: true,
    });

    let matches = results.matches || [];

    // Apply content type filter if requested
    if (type) {
      matches = matches.filter((m) => m.metadata.content_type === type);
    }

    // Apply minScore filter (default 0.75)
    const threshold = minScore ? parseFloat(minScore) : 0.80;
    matches = matches.filter((m) => m.score >= threshold);
    console.log("🔍 Matches:", matches.map(m => ({ id: m.id, score: m.score })));

    res.json(matches);
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
