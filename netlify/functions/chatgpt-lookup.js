import { MongoClient } from 'mongodb';

const DEBUG = true; // ✅ Toggle to false for production: no logs!

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    if (DEBUG) console.log("✅ Reusing cached MongoDB client");
    return cachedClient;
  }
  if (DEBUG) console.log("⏳ Connecting to MongoDB...");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  if (DEBUG) console.log("✅ Connected to MongoDB");
  cachedClient = client;
  return client;
}

export async function handler(event) {
  const startTime = Date.now();
  if (DEBUG) console.log("🔵 Function triggered");
  try {
    const { reference } = JSON.parse(event.body);
    if (DEBUG) console.log(`📌 Parsed reference: ${reference}`);

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
      Answer for ${reference} ONLY in this JSON format. No markdown or code fences.
    `;

    if (DEBUG) console.log("⏳ Sending request to OpenAI...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });
      if (DEBUG) console.log(`✅ OpenAI response received in ${Date.now() - startTime}ms`);
    } catch (err) {
      if (DEBUG) console.error("❌ OpenAI fetch failed:", err);
      return { statusCode: 500, body: JSON.stringify({ error: "OpenAI request failed." }) };
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();
    if (DEBUG) console.log("📜 GPT raw text:", text);

    const data = JSON.parse(text);
    let answer = data.choices[0].message.content.trim();

    if (answer.startsWith("```json")) {
      answer = answer.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (answer.startsWith("```")) {
      answer = answer.replace(/^```/, '').replace(/```$/, '').trim();
    }

    if (DEBUG) console.log("✅ Cleaned GPT answer:", answer);

    let parsed;
    try {
      parsed = JSON.parse(answer);
      if (DEBUG) console.log("✅ Parsed GPT JSON successfully");
    } catch (err) {
      if (DEBUG) console.error("❌ Failed to parse GPT answer:", err);
      return { statusCode: 200, body: JSON.stringify({ answer }) };
    }

    if (DEBUG) console.log("⏳ Connecting to MongoDB...");
    const client = await connectToDatabase();
    if (DEBUG) console.log(`⏳ Connected, writing to DB for ${parsed["Reference Number"]}...`);

    const collection = client.db('patek_db').collection('references');

    const exists = await collection.findOne({ reference: parsed["Reference Number"] });
    if (!exists) {
      await collection.insertOne({
        reference: parsed["Reference Number"],
        retail_price: parsed["Retail Price"],
        collection: parsed["Collection"],
        dial: parsed["Dial"],
        case: parsed["Case"],
        bracelet: parsed["Bracelet"],
        movement: parsed["Movement"]
      });
      if (DEBUG) console.log(`✅ Inserted ${parsed["Reference Number"]} to MongoDB`);
    } else {
      if (DEBUG) console.log(`ℹ️ ${parsed["Reference Number"]} already exists in MongoDB`);
    }

    if (DEBUG) console.log(`✅ ALL DONE in ${Date.now() - startTime}ms`);
    return {
      statusCode: 200,
      body: JSON.stringify({ answer })
    };

  } catch (err) {
    if (DEBUG) console.error("❌ Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.toString() }) };
  }
}

