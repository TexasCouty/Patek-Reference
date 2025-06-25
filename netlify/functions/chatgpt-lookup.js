const fetch = require('node-fetch');

exports.handler = async function (event) {
  console.log("⚡️ Function triggered");

  try {
    console.log("📝 Raw event body:", event.body);
    const { reference } = JSON.parse(event.body);
    console.log("🔍 Parsed reference:", reference);

    const fields = {
      reference: reference, // direct
      retail_price: "",
      collection: "",
      dial: "",
      case: "",
      bracelet: "",
      movement: ""
    };

    const questions = {
      retail_price: `What is the retail price of Patek Philippe reference ${reference}? Return only the price.`,
      collection: `What collection does the Patek Philippe reference ${reference} belong to? Return a short name like 'Nautilus', 'Complications', etc.`,
      dial: `What is the dial description of Patek Philippe reference ${reference}? Keep it concise.`,
      case: `What is the case description of Patek Philippe reference ${reference}?`,
      bracelet: `What is the bracelet or strap description of Patek Philippe reference ${reference}?`,
      movement: `What is the movement of Patek Philippe reference ${reference}?`
    };

    for (const key of Object.keys(questions)) {
      const question = questions[key];

      console.log(`📤 Asking OpenAI for ${key}:`, question);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a luxury watch expert. Respond as concisely and accurately as possible." },
            { role: "user", content: question }
          ],
          temperature: 0.2
        })
      });

      const data = await response.json();
      console.log(`🤖 GPT response for ${key}:`, data);

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error(`Missing response for ${key}`);
      }

      fields[key] = content;
    }

    console.log("✅ Final output:", fields);

    return {
      statusCode: 200,
      body: JSON.stringify(fields)
    };

  } catch (err) {
    console.error("❌ Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
