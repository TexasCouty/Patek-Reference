import { MongoClient } from 'mongodb';

const DEBUG = true;

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    if (DEBUG) console.log("✅ Using cached MongoDB connection");
    return cachedDb;
  }
  if (DEBUG) console.log("⏳ Connecting to MongoDB...");

  cachedClient = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  await cachedClient.connect();
  cachedDb = cachedClient.db('patek_db');

  if (DEBUG) console.log("✅ New MongoDB connected");
  return cachedDb;
}

export async function handler(event) {
  const start = Date.now();
  if (DEBUG) console.log("🔵 Function triggered");

  try {
    const { reference } = JSON.parse(event.body);
    if (DEBUG) console.log(`📌 Reference: ${reference}`);

    // ✅ 1) Connect & reuse MongoDB
    const db = await connectToDatabase();
    const collection = db.collection('references');

    // ✅ 2) Use correct field name: "Reference Number"
    const existing = await collection.findOne({ "Reference Number": reference });

    if (existing) {
      if (DEBUG) console.log(`✅ Found ${reference} in MongoDB`);
      return {
        statusCode: 200,
        body: JSON.stringify({ answer: existing })
      };
    }

    if (DEBUG) console.log(`❌ Not found in MongoDB. Calling OpenAI...`);

    // ✅ 3) Fallback to OpenAI
    const prompt = `
      Provide ONLY JSON for Patek Philippe reference ${reference}:
      {
        "Reference Number": "...",
        "Retail Price": "...",
        "Collection": "...",
        "Dial": "...",
        "Case": "...",
        "Bracelet": "...",
        "Movement": "..."
      }
    `;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }]
      }),
      timeout: 10000
    });

    const rawText = await openaiResponse.text();
    if (DEBUG) console.log("📜 GPT raw text:", rawText);

    const rawJson = JSON.parse(rawText);
    let answer = rawJson.choices[0].message.content.trim();
    if (answer.startsWith("```json")) answer = answer.replace(/^```json/, '').replace(/```$/, '').trim();
    if (answer.startsWith("```")) answer = answer.replace(/^```/, '').replace(/```$/, '').trim();
    if (DEBUG) console.log("✅ Cleaned GPT answer:", answer);

    const parsed = JSON.parse(answer);

    await collection.insertOne({
      ...parsed,
      addedAt: new Date()
    });

    if (DEBUG) console.log(`✅ Saved ${parsed["Reference Number"]} to MongoDB`);
    if (DEBUG) console.log(`✅ Done in ${Date.now() - start} ms`);

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: parsed })
    };

  } catch (err) {
    if (DEBUG) console.error("❌ ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

