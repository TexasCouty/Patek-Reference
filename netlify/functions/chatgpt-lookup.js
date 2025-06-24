import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function handler(event) {
  try {
    const { reference } = JSON.parse(event.body);
    console.log("Parsed reference:", reference);

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',  // ✅ OFFICIAL turbo model that works!
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });
    } catch (err) {
      console.error("❌ OpenAI fetch failed or aborted:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OpenAI request failed or timed out." })
      };
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();
    console.log("GPT raw text:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ Failed to parse OpenAI response JSON:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid OpenAI response JSON." })
      };
    }

    let answer = data.choices[0].message.content.trim();

    if (answer.startsWith("```json")) {
      answer = answer.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (answer.startsWith("```")) {
      answer = answer.replace(/^```/, '').replace(/```$/, '').trim();
    }

    console.log("Cleaned GPT answer:", answer);

    let parsed;
    try {
      parsed = JSON.parse(answer);
    } catch (err) {
      console.error("❌ Failed to parse GPT answer:", err);
      return {
        statusCode: 200,
        body: JSON.stringify({ answer })
      };
    }

    // ✅ Save to MongoDB BEFORE responding:
    const client = await connectToDatabase();
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
      console.log(`✅ Saved ${parsed["Reference Number"]} to MongoDB`);
    } else {
      console.log(`ℹ️ ${parsed["Reference Number"]} already exists in MongoDB`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ answer })
    };

  } catch (err) {
    console.error("❌ Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() })
    };
  }
}

