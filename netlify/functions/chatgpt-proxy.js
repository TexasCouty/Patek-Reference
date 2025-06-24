const fs = require('fs');
const path = require('path');

exports.handler = async function (event) {
  try {
    // ✅ Parse input
    const { reference } = JSON.parse(event.body);
    const ref = reference.toUpperCase();
    console.log(`🔍 Looking up reference: ${ref}`);

    // ✅ Load local JSON (kept in same folder for guaranteed packaging!)
    const jsonPath = path.join(__dirname, 'patek_refs.json');
    console.log(`📁 Using JSON at: ${jsonPath}`);
    const refs = JSON.parse(fs.readFileSync(jsonPath));

    // ✅ Check for local match
    const official = refs[ref];
    if (official) {
      console.log(`✅ Found local data for: ${ref}`);
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

    console.log(`⚠️ Not found in local JSON — querying ChatGPT for: ${ref}`);

    // ✅ If not found, fallback to ChatGPT
    const prompt = `You are a Patek Philippe expert. Give an elegant, accurate description for reference ${ref}. Include: Collection, Case, Dial, Strap, Movement, Water Resistance if known.`;

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
    console.log(`🤖 ChatGPT response: ${JSON.stringify(data)}`);

    const aiText = data?.choices?.[0]?.message?.content || `⚠️ Could not get ChatGPT description for ${ref}.`;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: aiText })
    };

  } catch (error) {
    console.error(`❌ Function error: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: `❌ Server error: ${error.message}` })
    };
  }
};

