const refs = require('./patek_refs');

exports.handler = async function (event) {
  try {
    const { reference } = JSON.parse(event.body);
    const ref = reference.toUpperCase();

    console.log(`🔍 Looking up ${ref}...`);

    const official = refs[ref];
    if (official) {
      const reply = `✅ Official Specs:
Collection: ${official.collection}
Case: ${official.case}
Dial: ${official.dial}
Strap: ${official.strap}
Movement: ${official.movement}
Link: ${official.link}`;
      return {
        statusCode: 200,
        body: JSON.stringify({ reply })
      };
    }

    const prompt = `Describe Patek Philippe reference ${ref}.`;
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await openAIResponse.json();
    const aiText = data?.choices?.[0]?.message?.content || "⚠️ No ChatGPT description.";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: aiText })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: `❌ Server error: ${err.message}` })
    };
  }
};
