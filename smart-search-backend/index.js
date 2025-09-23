const dotenv = require("dotenv");
const express = require("express");
const { HfInference } = require("@huggingface/inference");
const { Pinecone } = require("@pinecone-database/pinecone");
const bodyParser = require("body-parser");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Hugging Face inference client
const inference = new HfInference(process.env.HF_API_KEY);

// Pinecone client
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.Index(process.env.PINECONE_INDEX);

// --- Helpers ---
function cleanImageField(imageField) {
  if (!imageField) return null;
  const match = imageField.match(/<img.*?src="(.*?)"/);
  return match ? match[1] : imageField;
}

function cleanDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return isNaN(d.getTime()) ? isoDate : d.toISOString().split("T")[0];
}

// --- Embedding function ---
async function embedText(text) {
  const result = await inference.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });

  if (!result) throw new Error("Empty embedding result");

  // The HF featureExtraction API returns an array of arrays (tokens)
  // For sentence-transformers, take the **mean of token vectors** to get a single sentence embedding
  if (Array.isArray(result[0])) {
    const tokens = result[0];
    const sum = tokens[0].map((_, i) => tokens.reduce((acc, t) => acc + t[i], 0));
    return sum.map(v => v / tokens.length);
  }

  return result;
}


// --- Webhook endpoint ---
app.post("/webhook", async (req, res) => {
  try {
    console.log("✅ Webhook received!");
    const { data } = req.body;

    if (!data || !data.entry) return res.status(400).json({ error: "No entry in webhook payload" });

    const entry = data.entry;
    const contentType = data.content_type?.uid;

    // Build metadata dynamically
    let metadata = { content_type: contentType, title: entry.title, tags: entry.tags || [] };

    if (contentType === "products") {
      metadata = {
        ...metadata,
        url: `https://app.contentstack.com/#!/stack/${process.env.CONTENTSTACK_API_KEY}/entry/${entry.uid}`,
        description: entry.description,
        price: entry.price,
        product_image: cleanImageField(entry.product_image),
        category: entry.category,
      };
    } else if (contentType === "blogs") {
      metadata = {
        ...metadata,
        url: `https://app.contentstack.com/#!/stack/${process.env.CONTENTSTACK_API_KEY}/entry/${entry.uid}`,
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

    // Build text to embed
    let textToEmbed = `${entry.title} ${(entry.tags || []).join(" ")}`;
    if (contentType === "products") textToEmbed = `${entry.title} ${entry.description} ${(entry.tags || []).join(" ")}`;
    if (contentType === "blogs") textToEmbed = `${entry.title} ${entry.body} ${(entry.tags || []).join(" ")}`;
    if (contentType === "events") textToEmbed = `${entry.title} ${entry.description} ${entry.location} ${entry.start_date} ${entry.end_date} ${(entry.tags || []).join(" ")}`;

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

// --- Fetch single item by ID ---
app.get("/item/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const results = await index.query({
      id,
      topK: 1,
      includeMetadata: true,
      includeValues: false,
    });

    console.log("🔍 Pinecone query response:", JSON.stringify(results, null, 2));

    if (!results.matches || results.matches.length === 0) return res.status(404).json({ error: "Item not found in Pinecone" });

    const match = results.matches[0];
    res.json({ id: match.id, ...match.metadata });
  } catch (err) {
    console.error("❌ Item fetch error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
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

    if (type) matches = matches.filter((m) => m.metadata.content_type === type);

    const threshold = minScore ? parseFloat(minScore) : 0.5;
    matches = matches.filter((m) => m.score >= threshold);

    console.log("🔍 Matches:", matches.map((m) => ({ id: m.id, score: m.score })));
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
