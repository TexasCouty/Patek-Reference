const fetch = require('node-fetch');

exports.handler = async function (event) {
  console.log("⚡️ Function triggered");

  try {
    console.log("📝 Raw event body:", event.body);
    const { reference } = JSON.parse(event.body);
    console.log("🔍 Parsed reference:", reference);

    const model = "gpt-4o";
    const temperature = 0.2;

    // Helper to query OpenAI for a single field
    const queryOpenAI = async (question) => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a watch expert who provides concise but accurate answers." },
            { role: "user", content: question }
          ],
          temperature
        })
      });

      const data = await response.json();
      console.log(`📩 GPT Response for "${question}":`, data);

      const content = data.choices?.[0]?.message?.content?.trim();
      return content || "Unavailable";
    };

    // Ask each field separately
    const retail_price = await queryOpenAI(`What is the retail price of the Patek Philippe reference ${reference}?`);
    const collection = await queryOpenAI(`What collection does the Patek Philippe reference ${reference} belong to?`);
    const dial = await queryOpenAI(`Describe the dial of the Patek Philippe reference ${reference}, including color, material, and decoration style.`);
    const caseType = await queryOpenAI(`What is the case of the Patek Philippe reference ${reference}, including material and size?`);
    const bracelet = await queryOpenAI(`What type of bracelet or strap does the Patek Philippe reference ${reference} have?`);
    const movement = await queryOpenAI(`What is the movement used in the Patek Philippe reference ${reference}?`);

    const result = {
      reference,
      retail_price,
      collection,
      dial,
      case: caseType,
      bracelet,
      movement
    };

    console.log("✅ Final result:", result);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (err) {
    console.error("❌ Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

