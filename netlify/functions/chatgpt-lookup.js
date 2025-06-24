import fetch from "node-fetch";
import { MongoClient } from "mongodb";

// Debug toggle
const DEBUG = true;

// Global Mongo reuse
let cachedClient = null;

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference } = JSON.parse(req.body);
  if (DEBUG) console.log("🔵 Function triggered");
  if (DEBUG) console.log("📌 Reference:", reference);

  // ✅ Check MongoDB first
  const MONGO_URI = process.env.MONGODB_URI;
  const DB_NAME = "patek_db";
  const COLL_NAME = "references";

  if (DEBUG) console.log("⏳ Connecting to MongoDB:", MONGO_URI);

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
      await cachedClient.connect();
    }
    const db = cachedClient.db(DB_NAME);
    const coll = db.collection(COLL_NAME);

    const doc = await coll.findOne({ "Reference Number": reference });

    if (doc) {
      if (DEBUG) console.log("✅ Found in MongoDB!");
      return res.status(200).json(doc);
    } else {
      if (DEBUG) console.log("❌ Not found in MongoDB — will ask GPT...");
    }
  } catch (err) {
    if (DEBUG) console.error("❌ Mongo ERROR:", err);
  }

  // ✅ Fallback: Ask GPT
  if (DEBUG) console.log("⏳ Calling OpenAI...");
  const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: `Provide ONLY raw JSON for Patek reference ${reference} like:
{
  "Reference Number": "...",
  "Retail Price": "...",
  "Collection": "...",
  "Dial": "...",
  "Case": "...",
  "Bracelet": "...",
  "Movement": "..."
}
No markdown, no text — JSON only.`
        },
      ],
    }),
  });

  const rawText = await chatResponse.text();
  if (DEBUG) console.log("📜 GPT raw text:", rawText);

  let answer;
  try {
    answer = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    if (DEBUG) console.log("✅ Cleaned GPT answer:", answer);
  } catch (err) {
    if (DEBUG) console.error("❌ GPT JSON parse error:", err);
    return res.status(500).json({ error: "Could not parse GPT answer" });
  }

  // ✅ Save GPT answer to MongoDB
  try {
    if (cachedClient) {
      const db = cachedClient.db(DB_NAME);
      const coll = db.collection(COLL_NAME);
      await coll.insertOne(answer);
      if (DEBUG) console.log(`✅ Saved ${reference} to MongoDB!`);
    }
  } catch (err) {
    if (DEBUG) console.error("❌ Mongo save error:", err);
  }

  return res.status(200).json(answer);
};

