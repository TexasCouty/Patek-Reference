import { MongoClient } from "mongodb";
import OpenAI from "openai";

const openai = new OpenAI();
const uri = process.env.MONGODB_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    console.log("✅ Reusing Mongo connection");
    return cachedClient;
  }
  const client = new MongoClient(uri);
  await client.connect();
  console.log("✅ New Mongo connection");
  cachedClient = client;
  return client;
}

export default async (req, res) => {
  try {
    const body = JSON.parse(req.body);
    const ref = body.reference;
    if (!ref) throw new Error("No reference provided");
    console.log(`📌 Reference: ${ref}`);

    const client = await connectToDatabase();
    const db = client.db("patek");
    const collection = db.collection("watches");

    let doc = await collection.findOne({ reference: ref });

    if (doc) {
      console.log(`✅ Found in Mongo: ${ref}`);
      res.status(200).json(doc);
      return;
    }

    console.log(`❌ Not found in Mongo. Asking GPT...`);
    const gpt = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: `Provide JSON for Patek ref ${ref}. Keys: Reference Number, Retail Price, Collection, Dial, Case, Bracelet, Movement`
        }
      ]
    });

    const answer = JSON.parse(gpt.choices[0].message.content);
    console.log("✅ GPT Answer:", answer);

    await collection.insertOne({
      reference: answer["Reference Number"],
      ...answer,
    });

    res.status(200).json(answer);

  } catch (err) {
    console.error("❌ Function error:", err);
    res.status(500).json({ error: err.message });
  }
};

