import fs from 'fs';
import path from 'path';

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

    // ✅ Native fetch with manual timeout
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
          model: 'gpt-4o',
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

    // ✅ Robust parse: first get raw text, then parse manually
    const text = await response.text();
    console.log("GPT raw text:", text);

    if (!text) {
      console.error("❌ OpenAI returned empty response");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OpenAI returned empty response" })
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("❌ Failed to parse JSON:", e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to parse OpenAI response JSON" })
      };
    }

    let answer = data.choices[0].message.content.trim();

    // ✅ Strip possible code fences
    if (answer.startsWith("```json")) {
      answer = answer.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (answer.startsWith("```")) {
      answer = answer.replace(/^```/, '').replace(/```$/, '').trim();
    }

    console.log("Cleaned GPT answer:", answer);

    let parsed;
    try {
      parsed = JSON.parse(answer);
    } catch (e) {
      console.error("❌ Failed to parse cleaned answer:", e);
      return {
        statusCode: 200,
        body: JSON.stringify({ answer })
      };
    }

    // ✅ Try to save locally
    try {
      const jsonPath = path.resolve('patek_refs.json');
      const refs = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

      const exists = refs.find(r =>
        r.reference.toLowerCase() === parsed["Reference Number"].toLowerCase()
      );

      if (!exists) {
        refs.push({
          reference: parsed["Reference Number"],
          retail_price: parsed["Retail Price"],
          collection: parsed["Collection"],
          dial: parsed["Dial"],
          case: parsed["Case"],
          bracelet: parsed["Bracelet"],
          movement: parsed["Movement"]
        });
        fs.writeFileSync(jsonPath, JSON.stringify(refs, null, 2));
        console.log(`✅ Added ${parsed["Reference Number"]} to local patek_refs.json`);
      } else {
        console.log(`ℹ️ ${parsed["Reference Number"]} already exists`);
      }
    } catch (writeErr) {
      console.error("❌ Local JSON save failed:", writeErr);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ answer })
    };

  } catch (err) {
    console.error("❌ Top-level function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() })
    };
  }
}
