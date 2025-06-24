import { MongoClient } from 'mongodb';

const DEBUG = true; // ✅ Turn to false for production
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    if (DEBUG) console.log("✅ Reusing cached MongoDB client");
    return cachedClient;
  }
  if (DEBUG) console.log("⏳ Connecting to MongoDB...");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  if (DEBUG) console.log("✅ New MongoDB connection established");
  cachedClient = client;
  return client;
}

export async function handler(event) {
  const start = Date.now();
  if (DEBUG) console.log("🔵 Function triggered");

  try {
    const { reference } = JSON.parse(event.body);
    if (DEBUG) console.log(`📌 Reference: ${reference}`);

    // OpenAI prompt
    const prompt = `
      Provide ONLY raw JSON for Patek Philippe reference ${reference}:
      {
        "Reference Number": "...",
        "Retail Price": "...",
        "Collection": "...",
        "Dial": "...",
        "Case": "...",
        "Bracelet": "...",
        "Movement": "..."
      }
      Answer ONLY in JSON. No markdown.
    `;

    // Call OpenAI
    if (DEBUG) console.log("⏳ Calling OpenAI...");
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const rawText = await openaiResponse.text();
    if (DEBUG) console.log("📜 GPT raw text:", rawText);

    const rawJson = JSON.parse(rawText);
    let answer = rawJson.choices[0].message.content.trim();

    if (answer.startsWith("```json")) answer = answer.replace(/^```json/, '').replace(/```$/, '').trim();
    if (answer.startsWith("```")) answer = answer.replace(/^```/, '').replace(/```$/, '').trim();

    if (DEBUG) console.log("✅ Cleaned GPT answer:", answer);

    const parsed = JSON.parse(answer);

    // Save to MongoDB
    const dbStart = Date.now();
    const client = await connectToDatabase();
    const collection = client.db('patek_db').collection('references');

    const exists = await collection.findOne({ reference: parsed["Reference Number"] });
    if (exists) {
      if (DEBUG) console.log(`ℹ️ ${parsed["Reference Number"]} already in DB`);
    } else {
      await collection.insertOne({
        reference: parsed["Reference Number"],
        retail_price: parsed["Retail Price"],
        collection: parsed["Collection"],
        dial: parsed["Dial"],
        case: parsed["Case"],
        bracelet: parsed["Bracelet"],
        movement: parsed["Movement"],
        addedAt: new Date()
      });
      if (DEBUG) console.log(`✅ Saved ${parsed["Reference Number"]} to MongoDB in ${Date.now() - dbStart}ms`);
    }

    if (DEBUG) console.log(`✅ Function finished in ${Date.now() - start}ms`);

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: parsed })
    };

  } catch (err) {
    if (DEBUG) console.error("❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || err.toString() })
    };
  }
}

