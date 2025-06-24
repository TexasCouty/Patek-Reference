import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    console.log("✅ Reusing cached MongoDB client");
    return cachedClient;
  }
  console.log("⏳ Connecting to MongoDB...");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  console.log("✅ Connected to MongoDB");
  cachedClient = client;
  return client;
}

export async function handler(event) {
  console.log("🔵 Function triggered");
  const startTime = Date.now();
  try {
    const { reference } = JSON.parse(event.body);
    console.log(`📌 Parsed reference: ${reference}`);

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

    console.log("⏳ Sending request to OpenAI...");
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
      console.log(`✅ OpenAI response received in ${Date.now() - startTime}ms`);
    } catch (err) {
      console.error("❌ OpenAI fetch failed:", err);
      return { statusCode: 500, body: JSON.stringify({ error: "OpenAI request failed." }) };
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();
    console.log("📜 GPT raw text:", text);

    const data = JSON.parse(text);
    let answer = data.choices[0].message.content.trim();

    if (answer.startsWith("```json")) {
      answer = answer.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (answer.startsWith("```")) {
      answer = answer.replace(/^```/, '').replace(/```$/, '').trim();
    }

    console.log("✅ Cleaned GPT answer:", answer);

    let parsed;
    try {
      parsed = JSON.parse(answer);
      console.log("✅ Parsed GPT JSON successfully");
    } catch (err) {
      console.error("❌ Failed to parse GPT answer:", err);
      return { statusCode: 200, body: JSON.stringify({ answer }) };
    }

    console.log("⏳ Connecting to MongoDB...");
    const client = await connectToDatabase();
    console.log(`⏳ Connected, writing to DB for ${parsed["Reference Number"]}...`);

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
      console.log(`✅ Inserted ${parsed["Reference Number"]} to MongoDB`);
    } else {
      console.log(`ℹ️ ${parsed["Reference Number"]} already exists in MongoDB`);
    }

    console.log(`✅ ALL DONE in ${Date.now() - startTime}ms`);
    return {
      statusCode: 200,
      body: JSON.stringify({ answer })
    };

  } catch (err) {
    console.error("❌ Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.toString() }) };
  }
}

