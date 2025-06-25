const fetch = require("node-fetch");

// Helper to query a specific question from GPT
async function queryOpenAI(question) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a highly accurate watch expert. Provide reliable, sourced, and verified specifications for each component."
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.3
    })
  });

  const data = await response.json();
  console.log("🔍 GPT Answer:", data);
  return data.choices?.[0]?.message?.content?.trim() || "";
}

exports.handler = async function (event) {
  console.log("⚡️ Function triggered");

  try {
    const { reference } = JSON.parse(event.body);
    console.log("📦 Reference received:", reference);

    // Ask each field separately for better accuracy
    const retail_price = await queryOpenAI(`What is the retail price of the Patek Philippe watch with reference number ${reference}? Provide only the price.`);
    const collection = await queryOpenAI(`Which collection does the Patek Philippe watch with reference number ${reference} belong to? Give just the name of the collection.`);
    const dial = await queryOpenAI(`Please describe in rich detail the dial of the Patek Philippe watch with reference number ${reference}. Include its color, texture, pattern, markers, and any decorative techniques. Use official Patek specifications if known.`);
    const caseDesc = await queryOpenAI(`What is the case material and size of the Patek Philippe watch with reference number ${reference}?`);
    const bracelet = await queryOpenAI(`Describe the bracelet or strap of the Patek Philippe watch with reference number ${reference}.`);
    const movement = await queryOpenAI(`What is the movement used in the Patek Philippe watch with reference number ${reference}? Provide the caliber name and type.`);

    const result = {
      reference,
      retail_price,
      collection,
      dial,
      case: caseDesc,
      bracelet,
      movement
    };

    console.log("✅ Final result:", result);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error("❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
