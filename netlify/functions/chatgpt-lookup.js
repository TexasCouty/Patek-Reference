const fetch = require('node-fetch');

exports.handler = async function (event) {
  console.log("⚡️ Function triggered");

  try {
    console.log("📝 Raw event body:", event.body);
    const { reference } = JSON.parse(event.body);
    console.log("🔍 Parsed reference:", reference);

    const prompt = `You are an expert on luxury watches. Return only valid JSON (no markdown or extra text) about this Patek Philippe reference: ${reference}. Each field must be accurate and based on real data. If you're not sure, return "Unknown". Format:

{
  "reference": "...",
  "retail_price": "...",
  "collection": "...",
  "dial": "...",
  "case": "...",
  "bracelet": "...",
  "movement": "..."
}`;

    console.log("📤 Prompt to OpenAI:", prompt);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    const data = await openaiResponse.json();
    console.log("🤖 OpenAI raw response:", data);

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI.");
    }

    const jsonOutput = JSON.parse(data.choices[0].message.content);
    console.log("✅ Parsed JSON output:", jsonOutput);

    return {
      statusCode: 200,
      body: JSON.stringify(jsonOutput)
    };

  } catch (err) {
    console.error("❌ Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
