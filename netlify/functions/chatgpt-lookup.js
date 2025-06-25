const fetch = require('node-fetch');

async function askOpenAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a Patek Philippe reference expert. Provide short, accurate, structured answers." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })
  });

  const data = await response.json();
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error("Invalid OpenAI response.");
  }

  return data.choices[0].message.content.trim();
}

exports.handler = async function (event) {
  console.log("⚡️ Function triggered");

  try {
    console.log("📝 Raw event body:", event.body);
    const { reference } = JSON.parse(event.body);
    console.log("🔍 Parsed reference:", reference);

    const prompts = {
      retail_price: `What is the retail price of the Patek Philippe watch with reference ${reference}? Provide only the price in USD or CHF.`,
      collection: `What is the collection name for Patek Philippe reference ${reference}? Example: Nautilus, Aquanaut, Complications, Grand Complications.`,
      dial: `What is the dial description for the Patek Philippe reference ${reference}? Include color, style, and numerals. Return one descriptive sentence.`,
      case: `What is the case material and size of the Patek Philippe watch with reference ${reference}?`,
      bracelet: `What type of bracelet or strap is used in the Patek Philippe reference ${reference}? Include material and clasp type.`,
      movement: `What movement caliber is used in the Patek Philippe reference ${reference}? Provide full caliber name.`
    };

    const results = {};
    for (const [field, prompt] of Object.entries(prompts)) {
      console.log(`🧠 Asking for ${field}:`, prompt);
      results[field] = await askOpenAI(prompt);
    }

    const jsonOutput = {
      reference,
      retail_price: results.retail_price,
      collection: results.collection,
      dial: results.dial,
      case: results.case,
      bracelet: results.bracelet,
      movement: results.movement
    };

    console.log("✅ Final compiled result:", jsonOutput);

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

