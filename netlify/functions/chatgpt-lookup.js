const fetch = require('node-fetch');

exports.handler = async function (event) {
  console.log("⚡️ Function triggered");

  try {
    if (!event.body) {
      throw new Error("Missing request body");
    }

    console.log("📝 Raw event body:", event.body);
    const { reference } = JSON.parse(event.body);

    if (!reference) {
      throw new Error("Missing reference field in request body");
    }

    console.log("🔍 Parsed reference:", reference);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY in environment variables");
    }

    const prompt = `Provide ONLY raw JSON (no markdown) with these fields for Patek Philippe reference number ${reference}:
{
  "reference": "",
  "retail_price": "",
  "collection": "",
  "dial": "",
  "case": "",
  "bracelet": "",
  "movement": ""
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

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("❌ OpenAI API request failed:", openaiResponse.status, errorText);
      throw new Error(`OpenAI request failed: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    console.log("🤖 OpenAI raw response:", JSON.stringify(data, null, 2));

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned by OpenAI");
    }

    let jsonOutput;
    try {
      jsonOutput = JSON.parse(content);
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI response content:", content);
      throw new Error("OpenAI response was not valid JSON");
    }

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


