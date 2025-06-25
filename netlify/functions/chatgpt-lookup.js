const fetch = require('node-fetch');

exports.handler = async function (event) {
  console.log("⚡️ Function triggered");

  try {
    const { reference } = JSON.parse(event.body);
    console.log("🔍 Looking up:", reference);

    const prompt = `Tell me all the official technical details about the Patek Philippe watch reference ${reference}. Please include the following:
- Retail Price
- Collection name
- Dial description
- Case material and size
- Bracelet or strap type
- Movement (include caliber if known)

Respond in this format, no extra commentary or markdown:

Reference: ...
Retail Price: ...
Collection: ...
Dial: ...
Case: ...
Bracelet: ...
Movement: ...
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a luxury watch expert who replies with technical details only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    const data = await response.json();
    console.log("🤖 GPT response:", data);

    const content = data.choices?.[0]?.message?.content || "";
    const lines = content.split("\n").filter(line => line.includes(":"));
    const fields = { reference };

    for (const line of lines) {
      const [key, ...rest] = line.split(":");
      const field = key.trim().toLowerCase().replace(/\s+/g, "_");
      fields[field] = rest.join(":").trim();
    }

    console.log("✅ Final parsed fields:", fields);

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
