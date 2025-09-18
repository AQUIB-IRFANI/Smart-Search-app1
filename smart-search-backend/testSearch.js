require("dotenv").config();
const { HfInference } = require("@huggingface/inference");
const { Pinecone } = require("@pinecone-database/pinecone");

const hf = new HfInference(process.env.HF_API_KEY);
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX);

async function embedText(text) {
  const res = await hf.featureExtraction({
    model: "intfloat/multilingual-e5-large",
    inputs: text,
  });

  // HuggingFace returns nested arrays sometimes: [[1024 floats]]
  const embedding = Array.isArray(res[0]) ? res[0] : res;
  return Array.from(embedding); // make sure it's plain JS array
}

async function search(query) {
  console.log(`🔍 Searching for: "${query}"`);
  const queryEmbedding = await embedText(query);

  const results = await index.query({
    vector: queryEmbedding, // ✅ directly pass array of numbers
    topK: 3,
    includeMetadata: true,
  });

  console.log("✅ Search results:");
  console.dir(results.matches, { depth: null });
}

search("living room furniture");
