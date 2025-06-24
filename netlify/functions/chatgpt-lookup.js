import { MongoClient } from "mongodb";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MONGODB_URI = process.env.MONGODB_URI;

export async function handler(event) {
  console.log(`[${new Date().toISOString()}] 🔵 Lambda STARTED ----------------------------`);

  try {
    const { reference } = JSON.parse(event.body || '{}');
    console.log(`[${new Date().toISOString()}] 📌 Parsed reference: ${reference}`);

    console.log(`[${new Date().toISOString()}] ⏳ Connecting to MongoDB...`);
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    const collection = db.collection("watches");

    console.log(`[${new Date().toISOString()}] ⏳ Searching MongoDB for: ${reference}`);
    const found = await collection.findOne({ reference: reference });

    if (found) {
      console.log(`[${new Date().toISOString()}] ✅ Found in DB: ${JSON.stringify(found)}`);
      await client.close();
      return {
        statusCode: 200,
        body: JSON.stringify(found)
      };
    }

    console.log(`[${new Date().toISOString()}] ❌ Reference ${reference} not found in DB. Asking OpenAI...`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Reply ONLY with raw JSON for the requested watch reference, no markdown, no text."
        },
        {
          role: "user",
          content: `Provide detailed JSON for Patek Philippe reference ${reference}.`
        }
      ]
    });

    let raw = completion.choices[0].message.content;
    console.log(`[${new Date().toISOString()}] ✅ Raw OpenAI response: ${raw}`);

    // ✅ Clean code block if exists
    raw = raw.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/```[\s\S]*?(\{[\s\S]*\})[\s\S]*?```/, '$1');
    }

    // ✅ Parse cleaned JSON
    const parsed = JSON.parse(raw);
    console.log(`[${new Date().toISOString()}] ✅ Cleaned & parsed JSON: ${JSON.stringify(parsed)}`);

    // ✅ Save to MongoDB
    await collection.insertOne(parsed);
    console.log(`[${new Date().toISOString()}] ✅ Saved ${reference} to MongoDB.`);

    await client.close();
    return {
      statusCode: 200,
      body: JSON.stringify(parsed)
    };

  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Handler error:`, err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

