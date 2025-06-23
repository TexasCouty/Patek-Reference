const fs = require('fs');
const path = require('path');

const refs = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../patek_refs.json'))
);

exports.handler = async function (event) {
  try {
    const { reference } = JSON.parse(event.body);
    const ref = reference.toUpperCase();

    console.log("Looking up:", ref);

    const official = refs[ref];
    let officialText = "";

    if (official) {
      officialText = `✅ Official Specs:
- Collection: ${official.collection}
- Case: ${official.case}
- Dial: ${official.dial}
- Strap: ${official.strap}
- Movement: ${official.movement}
- Link: ${official.link}`;
    } else {
      officialText = `⚠️ No official data found for ${ref}.`;
    }

    const prompt = `You are a Patek Philippe expert. Write a short, elegant description for reference ${ref}.`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const raw = await openAIResponse.text();
    console.log("OpenAI raw:", raw);

    let data = {};
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse error:", e);
    }

    let aiText = "";
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      aiText = data.choices[0].message.content;
    } else {
      aiText = "⚠️ Could not get ChatGPT description.";
    }

    const finalReply = `${officialText}\n\n✅ ChatGPT Description:\n${aiText}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: finalReply })
    };

  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: `❌ Server error: ${error.message}`
      })
    };
  }
};
