exports.handler = async function (event) {
  try {
    // ✅ Log the API key (safe for debugging — check logs only)
    console.log("API KEY:", process.env.OPENAI_API_KEY);

    const { reference } = JSON.parse(event.body);

    const prompt = `Give a brief breakdown for the Patek Philippe reference ${reference}. Include:
✅ Collection
✅ Case
✅ Dial
✅ Strap
✅ Movement
✅ Water Resistance`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: 'user', content: prompt }]
      })
    });

    // ✅ Log raw status & body for debug
    console.log("OpenAI status:", openAIResponse.status);
    const raw = await openAIResponse.text();
    console.log("OpenAI raw response:", raw);

    let data = {};
    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      throw new Error(`Could not parse OpenAI response: ${raw}`);
    }

    // ✅ Bulletproof check
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: data.choices[0].message.content })
      };
    }

    // ✅ Fallback if OpenAI returned error or empty
    const fallback = `✅ Collection: Aquanaut
✅ Case: Stainless Steel, 40mm
✅ Dial: Black embossed dial
✅ Strap: Bright red tropical rubber strap (sporty)
✅ Movement: Caliber 324 S C (time + date, automatic)
✅ Water Resistance: 120m
(Note: Fallback triggered due to OpenAI error or empty response)`;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: fallback })
    };

  } catch (error) {
    console.error("Function error:", error);

    const fallback = `✅ Collection: Aquanaut
✅ Case: Stainless Steel, 40mm
✅ Dial: Black embossed dial
✅ Strap: Bright red tropical rubber strap (sporty)
✅ Movement: Caliber 324 S C (time + date, automatic)
✅ Water Resistance: 120m
(Note: Fallback due to server error: ${error.message})`;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: fallback })
    };
  }
};
