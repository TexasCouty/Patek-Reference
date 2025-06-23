exports.handler = async function (event) {
  try {
    const { reference } = JSON.parse(event.body);

    const prompt = `Give a detailed breakdown for the Patek Philippe reference ${reference}. Include:
✅ Collection
✅ Case
✅ Dial
✅ Strap
✅ Movement
✅ Water Resistance`;

    // ✅ Use native fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

    const data = await response.json();

    exports.handler = async function (event) {
  try {
    const { reference } = JSON.parse(event.body);

    const prompt = `Give a detailed breakdown for the Patek Philippe reference ${reference}. Include:
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
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await openAIResponse.json();

    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    // If OpenAI worked, return its reply
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply: data.choices[0].message.content
        })
      };
    }

    // If OpenAI returned an error (e.g., quota), use fallback
    const fallback = `✅ Collection: Aquanaut
✅ Case: Stainless Steel, 40mm
✅ Dial: Black embossed dial
✅ Strap: Bright red tropical rubber strap (sporty)
✅ Movement: Caliber 324 S C (time + date, automatic)
✅ Water Resistance: 120m
(Note: This is a placeholder fallback — your OpenAI quota may be exhausted)`;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: fallback })
    };

  } catch (error) {
    console.error('Function error:', error);

    // Even if code crashes, always return a fallback reply
    const fallback = `✅ Collection: Aquanaut
✅ Case: Stainless Steel, 40mm
✅ Dial: Black embossed dial
✅ Strap: Bright red tropical rubber strap (sporty)
✅ Movement: Caliber 324 S C (time + date, automatic)
✅ Water Resistance: 120m
(Note: This is a fallback because of a server error: ${error.message})`;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: fallback })
    };
  }
};

